using FluentValidation;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class CreateAssignmentRuleValidator : AbstractValidator<CreateAssignmentRuleDto>
{
    public CreateAssignmentRuleValidator()
    {
        RuleFor(x => x.strRuleName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.strAssignmentType).NotEmpty().Must(t => AssignmentTypeConstants.AllTypes.Contains(t))
            .WithMessage($"Type must be one of: {string.Join(", ", AssignmentTypeConstants.AllTypes)}");
        RuleFor(x => x.intPriority).GreaterThanOrEqualTo(0);
    }
}
