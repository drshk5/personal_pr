namespace crm_backend.Helpers;

public static class LevenshteinHelper
{
    public static int Calculate(string source, string target)
    {
        if (string.IsNullOrEmpty(source)) return target?.Length ?? 0;
        if (string.IsNullOrEmpty(target)) return source.Length;

        source = source.ToLowerInvariant();
        target = target.ToLowerInvariant();

        var sourceLength = source.Length;
        var targetLength = target.Length;
        var distance = new int[sourceLength + 1, targetLength + 1];

        for (var i = 0; i <= sourceLength; i++) distance[i, 0] = i;
        for (var j = 0; j <= targetLength; j++) distance[0, j] = j;

        for (var i = 1; i <= sourceLength; i++)
        {
            for (var j = 1; j <= targetLength; j++)
            {
                var cost = source[i - 1] == target[j - 1] ? 0 : 1;
                distance[i, j] = Math.Min(
                    Math.Min(distance[i - 1, j] + 1, distance[i, j - 1] + 1),
                    distance[i - 1, j - 1] + cost);
            }
        }

        return distance[sourceLength, targetLength];
    }

    public static double Similarity(string source, string target)
    {
        if (string.IsNullOrEmpty(source) && string.IsNullOrEmpty(target)) return 100.0;
        if (string.IsNullOrEmpty(source) || string.IsNullOrEmpty(target)) return 0.0;

        var maxLength = Math.Max(source.Length, target.Length);
        if (maxLength == 0) return 100.0;

        var distance = Calculate(source, target);
        return (1.0 - (double)distance / maxLength) * 100.0;
    }
}
