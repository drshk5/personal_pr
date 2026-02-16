using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class LogCallValidator : AbstractValidator<LogCallDto>
{
    public LogCallValidator()
    {
        RuleFor(x => x.strLeadGUID).NotEmpty();
        RuleFor(x => x.strDirection).NotEmpty().Must(d => d == "Inbound" || d == "Outbound");
        RuleFor(x => x.intDurationSeconds).GreaterThanOrEqualTo(0).When(x => x.intDurationSeconds.HasValue);
        RuleFor(x => x.strCallOutcome).MaximumLength(100);
    }
}
