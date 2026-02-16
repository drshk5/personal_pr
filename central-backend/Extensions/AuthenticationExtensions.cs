using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using AuditSoftware.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AuditSoftware.Extensions
{
    public static class AuthenticationExtensions
    {
        /// <summary>
        /// Adds custom JWT Bearer authentication with token extraction from Authorization header only.
        /// Tokens are decrypted if needed and validated via IAuthService.
        /// </summary>
        public static IServiceCollection AddCustomJwtAuthentication(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                // Determine environment for security settings
                var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                    ?.Equals("Development", StringComparison.OrdinalIgnoreCase) ?? false;

                // ✅ SECURITY: Enforce HTTPS in production (prevent MITM token theft)
                options.RequireHttpsMetadata = !isDevelopment;

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["Jwt:Key"]
                            ?? throw new InvalidOperationException("JWT Key not found in configuration"))),
                    
                    // ✅ SECURITY: Tight clock tolerance (prevent token replay after expiry)
                    ClockSkew = TimeSpan.FromMinutes(1),
                    
                    // ✅ SECURITY: Only accept HS256 (prevent algorithm confusion attacks)
                    ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 }
                };

                // ✅ JWT Events for token extraction and validation
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var path = context.Request.Path.Value ?? "";
                        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                        var hasAuth = !string.IsNullOrWhiteSpace(authHeader);
                        Console.WriteLine($"[AUTH] OnMessageReceived path={path} hasAuth={hasAuth}");

                        // Skip token validation for refresh-token endpoint to allow expired tokens
                        if (path.Equals("/api/auth/refresh-token", StringComparison.OrdinalIgnoreCase) ||
                            path.Equals("/api/Auth/refresh-token", StringComparison.OrdinalIgnoreCase))
                        {
                            Console.WriteLine("[AUTH] Skipping token validation for refresh-token endpoint");
                            context.NoResult();
                            return Task.CompletedTask;
                        }

                        if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                        {
                            var raw = authHeader.Substring(7).Trim();
                            Console.WriteLine($"[AUTH] Bearer token length={raw.Length}");

                            var handler = new JwtSecurityTokenHandler();
                            if (handler.CanReadToken(raw))
                            {
                                context.Token = raw;
                                context.HttpContext.Items["TokenString"] = raw;
                                Console.WriteLine("[AUTH] Token parsed as plain JWT");
                            }
                            else
                            {
                                try
                                {
                                    var authService = context.HttpContext.RequestServices.GetRequiredService<IAuthService>();
                                    var decrypted = authService.DecryptToken(raw);
                                    context.Token = decrypted;
                                    context.HttpContext.Items["TokenString"] = decrypted;
                                    Console.WriteLine("[AUTH] Token decrypted successfully");
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[AUTH] Decrypt failed: {ex.Message}");
                                }
                            }
                        }
                        else
                        {
                            Console.WriteLine("[AUTH] No Bearer token in Authorization header");
                        }

                        return Task.CompletedTask;
                    },

                    OnTokenValidated = context =>
                    {
                        Console.WriteLine("[AUTH] OnTokenValidated called");
                        try
                        {
                            var authService = context.HttpContext.RequestServices.GetRequiredService<IAuthService>();

                            // Get the token string we stored in HttpContext.Items during OnMessageReceived
                            var tokenValue = context.HttpContext.Items["TokenString"] as string;

                            if (string.IsNullOrEmpty(tokenValue))
                            {
                                Console.WriteLine("[AUTH] Token string not found in context");
                                context.Fail("Invalid token instance");
                                return Task.CompletedTask;
                            }

                            var isValid = authService.ValidateTokenAsync(tokenValue).GetAwaiter().GetResult();
                            Console.WriteLine($"[AUTH] ValidateTokenAsync returned={isValid}");

                            if (!isValid)
                            {
                                context.Fail("Invalid token or group license expired");
                                return Task.CompletedTask;
                            }

                            Console.WriteLine("[AUTH] Token validation passed");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[AUTH] OnTokenValidated error: {ex.Message}");
                            context.Fail(ex.Message);
                        }

                        var identity = context.Principal?.Identity as ClaimsIdentity;
                        if (identity != null)
                        {
                            foreach (var claim in identity.Claims)
                                Console.WriteLine($"[JWT] Claim: {claim.Type} = {claim.Value}");
                        }

                        return Task.CompletedTask;
                    }
                };
            });

            return services;
        }
    }
}
