using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class OpportunityUpdateDtoValidator : AbstractValidator<UpdateOpportunityDto>
{
    private static readonly string[] ValidCurrencies = { "INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED" };

    public OpportunityUpdateDtoValidator()
    {
        RuleFor(x => x.strOpportunityName)
            .NotEmpty().WithMessage("Opportunity name is required")
            .MaximumLength(200).WithMessage("Opportunity name must not exceed 200 characters");

        RuleFor(x => x.strStageGUID)
            .NotEmpty().WithMessage("Stage is required");

        RuleFor(x => x.dblAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Amount must be non-negative")
            .When(x => x.dblAmount.HasValue);

        RuleFor(x => x.strCurrency)
            .Must(c => ValidCurrencies.Contains(c))
            .WithMessage($"Currency must be one of: {string.Join(", ", ValidCurrencies)}")
            .When(x => !string.IsNullOrEmpty(x.strCurrency));

        RuleFor(x => x.strDescription)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.strDescription));
    }
}
