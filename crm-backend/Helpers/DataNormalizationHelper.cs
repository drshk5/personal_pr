namespace crm_backend.Helpers;

public static class DataNormalizationHelper
{
    public static string NormalizeEmail(string email)
    {
        return email?.Trim().ToLowerInvariant() ?? string.Empty;
    }

    public static string NormalizeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return string.Empty;

        var trimmed = name.Trim();
        return char.ToUpper(trimmed[0]) + trimmed[1..].ToLowerInvariant();
    }

    public static string? NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        return phone.Trim().Replace(" ", "").Replace("-", "");
    }

    public static string? TrimOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }
}
