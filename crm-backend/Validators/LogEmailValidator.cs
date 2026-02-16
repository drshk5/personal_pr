using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class LogEmailValidator : AbstractValidator<LogEmailDto>
{
    public LogEmailValidator()
    {
        RuleFor(x => x.strLeadGUID).NotEmpty();
        RuleFor(x => x.strDirection).NotEmpty().Must(d => d == "Inbound" || d == "Outbound");
        RuleFor(x => x.strSubject).MaximumLength(300);
        RuleFor(x => x.strFromAddress).MaximumLength(255);
        RuleFor(x => x.strToAddress).MaximumLength(255);
    }
}
