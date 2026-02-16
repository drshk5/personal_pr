namespace crm_backend.Constants;

public static class WebFormFieldTypeConstants
{
    public const string Text = "Text";
    public const string Email = "Email";
    public const string Phone = "Phone";
    public const string Dropdown = "Dropdown";
    public const string TextArea = "TextArea";
    public const string Hidden = "Hidden";

    public static readonly string[] AllTypes = { Text, Email, Phone, Dropdown, TextArea, Hidden };
}
