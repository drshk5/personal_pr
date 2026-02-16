using FluentValidation;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class CreateWorkflowRuleValidator : AbstractValidator<CreateWorkflowRuleDto>
{
    public CreateWorkflowRuleValidator()
    {
        RuleFor(x => x.strRuleName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.strEntityType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.strTriggerEvent).NotEmpty().Must(t => WorkflowTriggerConstants.AllTriggers.Contains(t))
            .WithMessage($"Trigger event must be one of: {string.Join(", ", WorkflowTriggerConstants.AllTriggers)}");
        RuleFor(x => x.strActionType).NotEmpty().Must(a => WorkflowActionConstants.AllActions.Contains(a))
            .WithMessage($"Action type must be one of: {string.Join(", ", WorkflowActionConstants.AllActions)}");
        RuleFor(x => x.intDelayMinutes).GreaterThanOrEqualTo(0);
    }
}
