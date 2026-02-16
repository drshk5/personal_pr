using Microsoft.AspNetCore.Mvc.Filters;

namespace crm_backend.Attributes;

public class TrimStringsAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        foreach (var arg in context.ActionArguments)
        {
            if (arg.Value == null) continue;

            var type = arg.Value.GetType();
            if (type.IsPrimitive || type == typeof(string)) continue;

            var properties = type.GetProperties()
                .Where(p => p.PropertyType == typeof(string) && p.CanRead && p.CanWrite);

            foreach (var prop in properties)
            {
                var value = prop.GetValue(arg.Value) as string;
                if (value != null)
                {
                    prop.SetValue(arg.Value, value.Trim());
                }
            }
        }

        base.OnActionExecuting(context);
    }
}
