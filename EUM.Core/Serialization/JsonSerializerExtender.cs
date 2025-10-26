using EUM.Logging.Logging;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EUM.Core.Serialization
{
    public static class JsonSerializerExtender
    {
        private static readonly JsonSerializerOptions SerializerOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };

        public static string Serialize(object? value)
        {
            if (value == null)
            {
                return string.Empty;
            }

            return JsonSerializer.Serialize(value, SerializerOptions);
        }

        public static T? Deserialize<T>(string json) where T : class
        {
            try
            {
                return JsonSerializer.Deserialize<T>(json, SerializerOptions);
            }
            catch (Exception ex)
            {
                LogProvider.LogException(ex, nameof(JsonSerializerExtender));
                return default;
            }
        }
    }
}
