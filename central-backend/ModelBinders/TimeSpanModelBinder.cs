using Microsoft.AspNetCore.Mvc.ModelBinding;
using System;
using System.Threading.Tasks;

namespace AuditSoftware.ModelBinders
{
    public class TimeSpanModelBinder : IModelBinder
    {
        public Task BindModelAsync(ModelBindingContext bindingContext)
        {
            if (bindingContext == null)
            {
                throw new ArgumentNullException(nameof(bindingContext));
            }

            var modelName = bindingContext.ModelName;
            var valueProviderResult = bindingContext.ValueProvider.GetValue(modelName);

            if (valueProviderResult == ValueProviderResult.None)
            {
                return Task.CompletedTask;
            }

            bindingContext.ModelState.SetModelValue(modelName, valueProviderResult);

            var value = valueProviderResult.FirstValue;

            if (string.IsNullOrEmpty(value))
            {
                return Task.CompletedTask;
            }

            if (TimeSpan.TryParse(value, out TimeSpan timeSpan))
            {
                bindingContext.Result = ModelBindingResult.Success(timeSpan);
            }
            else
            {
                bindingContext.ModelState.TryAddModelError(modelName, "Invalid time format. Use HH:mm:ss format.");
            }

            return Task.CompletedTask;
        }
    }
} 