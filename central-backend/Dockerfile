# Use the official .NET SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY AuditSoftware.csproj ./
RUN dotnet restore "AuditSoftware.csproj"

# Copy the rest of the application code
COPY . .

# Build the application
RUN dotnet build "AuditSoftware.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "AuditSoftware.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the official .NET Runtime image for running the application
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copy the published application from the publish stage
COPY --from=publish /app/publish .

# Expose the port the app runs on
EXPOSE 8080
EXPOSE 8081

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the application
ENTRYPOINT ["dotnet", "AuditSoftware.dll"]
