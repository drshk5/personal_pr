using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class WebFormSubmitValidator : AbstractValidator<WebFormSubmitDto>
{
    public WebFormSubmitValidator()
    {
        RuleFor(x => x.Fields)
            .NotNull().WithMessage("Fields are required")
            .NotEmpty().WithMessage("At least one field value must be submitted");

        RuleFor(x => x.strUtmSource)
            .MaximumLength(500).WithMessage("UTM source must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.strUtmSource));

        RuleFor(x => x.strUtmMedium)
            .MaximumLength(500).WithMessage("UTM medium must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.strUtmMedium));

        RuleFor(x => x.strUtmCampaign)
            .MaximumLength(500).WithMessage("UTM campaign must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.strUtmCampaign));

        RuleFor(x => x.strUtmTerm)
            .MaximumLength(500).WithMessage("UTM term must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.strUtmTerm));

        RuleFor(x => x.strUtmContent)
            .MaximumLength(500).WithMessage("UTM content must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.strUtmContent));
    }
}
