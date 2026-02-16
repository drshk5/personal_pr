using FluentValidation;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class CreateScoringRuleValidator : AbstractValidator<CreateScoringRuleDto>
{
    public CreateScoringRuleValidator()
    {
        RuleFor(x => x.strRuleName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.strRuleCategory).NotEmpty().Must(c => ScoringRuleCategoryConstants.AllCategories.Contains(c))
            .WithMessage($"Category must be one of: {string.Join(", ", ScoringRuleCategoryConstants.AllCategories)}");
        RuleFor(x => x.strConditionField).NotEmpty().MaximumLength(100);
        RuleFor(x => x.strConditionOperator).NotEmpty().MaximumLength(20);
        RuleFor(x => x.strConditionValue).MaximumLength(500);
        RuleFor(x => x.intScorePoints).InclusiveBetween(-100, 100);
        RuleFor(x => x.intDecayDays).GreaterThan(0).When(x => x.intDecayDays.HasValue);
    }
}
