namespace crm_backend.Helpers;

public static class GuidHelper
{
    public static bool IsValidGuid(string? value)
    {
        return !string.IsNullOrWhiteSpace(value) && Guid.TryParse(value, out var guid) && guid != Guid.Empty;
    }

    public static Guid? ParseOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return Guid.TryParse(value, out var guid) ? guid : null;
    }
}
