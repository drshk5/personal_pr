using AuditSoftware.Helpers;
using System;

// Test program to validate DateTimeProvider behavior
public class DateTimeTest
{
    public static void Main()
    {
        // Get the current UTC time
        var utcNow = DateTime.UtcNow;
        Console.WriteLine($"UTC Now: {utcNow}");
        
        // Get the current IST time from DateTimeProvider
        var istNow = DateTimeProvider.Now;
        Console.WriteLine($"IST Now from DateTimeProvider: {istNow}");
        Console.WriteLine($"Kind: {istNow.Kind}"); // Should be Local
        
        // Format using the DateTimeProvider extension method
        var formattedIst = istNow.FormatIst();
        Console.WriteLine($"Formatted IST: {formattedIst}");
        
        // Check if the difference is actually 5.5 hours
        var diff = istNow - utcNow;
        Console.WriteLine($"Difference in hours: {diff.TotalHours}"); // Should be 5.5
        
        // Test converting UTC to IST
        var convertedIst = utcNow.ToIst();
        Console.WriteLine($"Converted UTC to IST: {convertedIst}");
        Console.WriteLine($"Kind after conversion: {convertedIst.Kind}"); // Should be Local
    }
}
