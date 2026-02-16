using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class OpportunityCreateDtoValidator : AbstractValidator<CreateOpportunityDto>
{
    private static readonly string[] ValidCurrencies = { "INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED" };

    public OpportunityCreateDtoValidator()
    {
        RuleFor(x => x.strOpportunityName)
            .NotEmpty().WithMessage("Opportunity name is required")
            .MaximumLength(200).WithMessage("Opportunity name must not exceed 200 characters");

        RuleFor(x => x.strPipelineGUID)
            .NotEmpty().WithMessage("Pipeline is required");

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

        RuleForEach(x => x.Contacts).ChildRules(contact =>
        {
            contact.RuleFor(c => c.strContactGUID)
                .NotEmpty().WithMessage("Contact GUID is required");

            contact.RuleFor(c => c.strRole)
                .MaximumLength(50).WithMessage("Role must not exceed 50 characters")
                .When(c => !string.IsNullOrEmpty(c.strRole));
        }).When(x => x.Contacts != null && x.Contacts.Count > 0);
    }
}
