using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class AccountCreateDtoValidator : AbstractValidator<CreateAccountDto>
{
    public AccountCreateDtoValidator()
    {
        RuleFor(x => x.strAccountName)
            .NotEmpty().WithMessage("Account name is required")
            .MaximumLength(200).WithMessage("Account name must not exceed 200 characters");

        RuleFor(x => x.strIndustry)
            .MaximumLength(100).WithMessage("Industry must not exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.strIndustry));

        RuleFor(x => x.strWebsite)
            .MaximumLength(500).WithMessage("Website must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.strWebsite));

        RuleFor(x => x.strPhone)
            .MaximumLength(20).WithMessage("Phone must not exceed 20 characters")
            .When(x => !string.IsNullOrEmpty(x.strPhone));

        RuleFor(x => x.strEmail)
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(255).WithMessage("Email must not exceed 255 characters")
            .When(x => !string.IsNullOrEmpty(x.strEmail));

        RuleFor(x => x.intEmployeeCount)
            .GreaterThanOrEqualTo(0).WithMessage("Employee count must be a positive number")
            .When(x => x.intEmployeeCount.HasValue);

        RuleFor(x => x.dblAnnualRevenue)
            .GreaterThanOrEqualTo(0).WithMessage("Annual revenue must be a positive number")
            .When(x => x.dblAnnualRevenue.HasValue);

        RuleFor(x => x.strAddress)
            .MaximumLength(500).When(x => !string.IsNullOrEmpty(x.strAddress));

        RuleFor(x => x.strCity)
            .MaximumLength(100).When(x => !string.IsNullOrEmpty(x.strCity));

        RuleFor(x => x.strState)
            .MaximumLength(100).When(x => !string.IsNullOrEmpty(x.strState));

        RuleFor(x => x.strCountry)
            .MaximumLength(100).When(x => !string.IsNullOrEmpty(x.strCountry));

        RuleFor(x => x.strPostalCode)
            .MaximumLength(20).When(x => !string.IsNullOrEmpty(x.strPostalCode));

        RuleFor(x => x.strDescription)
            .MaximumLength(4000).WithMessage("Description must not exceed 4000 characters")
            .When(x => !string.IsNullOrEmpty(x.strDescription));
    }
}
