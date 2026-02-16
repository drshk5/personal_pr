using System;
using System.Diagnostics;
using AuditSoftware.Helpers;

namespace AuditSoftware.Tests
{
    public class DateTimeTest
    {
        public static void TestDateTimeProvider()
        {
            Console.WriteLine("Testing DateTimeProvider");
            
            // Get current UTC time
            var utcNow = DateTime.UtcNow;
            Console.WriteLine($"UTC Now: {utcNow} (Kind: {utcNow.Kind})");
            
            // Get current IST time from DateTimeProvider
            var istNow = DateTimeProvider.Now;
            Console.WriteLine($"IST Now from Provider: {istNow} (Kind: {istNow.Kind})");
            
            // Convert UTC to IST manually
            var manualIst = utcNow.AddHours(5.5);
            Console.WriteLine($"Manual IST conversion: {manualIst} (Kind: {manualIst.Kind})");
            
            // Test ToIst extension method on a UTC time
            var convertedUtc = DateTimeProvider.ToIst(utcNow);
            Console.WriteLine($"UTC converted to IST: {convertedUtc} (Kind: {convertedUtc.Kind})");
            
            // Test ToIst extension method on a Local time
            var localTime = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Local);
            var convertedLocal = DateTimeProvider.ToIst(localTime);
            Console.WriteLine($"Local time: {localTime} (Kind: {localTime.Kind})");
            Console.WriteLine($"Local converted to IST: {convertedLocal} (Kind: {convertedLocal.Kind})");
            
            // Format dates
            Console.WriteLine($"Formatted IST Now: {istNow.ToString("dd-MMM-yyyy hh:mm:ss tt")}");
        }
    }
}
