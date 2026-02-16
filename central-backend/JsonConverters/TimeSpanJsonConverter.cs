using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AuditSoftware.JsonConverters
{
    public class TimeSpanJsonConverter : JsonConverter<TimeSpan?>
    {
        public override TimeSpan? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType != JsonTokenType.String)
            {
                throw new JsonException("Expected string value for TimeSpan");
            }

            var value = reader.GetString();
            if (string.IsNullOrEmpty(value))
            {
                return null;
            }

            if (TimeSpan.TryParse(value, out var timeSpan))
            {
                return timeSpan;
            }

            throw new JsonException($"Invalid TimeSpan format: {value}. Use HH:mm:ss format.");
        }

        public override void Write(Utf8JsonWriter writer, TimeSpan? value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                writer.WriteNullValue();
            }
            else
            {
                writer.WriteStringValue(value.Value.ToString(@"hh\:mm\:ss"));
            }
        }
    }
} 