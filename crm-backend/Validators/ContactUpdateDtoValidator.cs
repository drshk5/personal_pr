using FluentValidation;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class ContactUpdateDtoValidator : AbstractValidator<UpdateContactDto>
{
    public ContactUpdateDtoValidator()
    {
        RuleFor(x => x.strFirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters");

        RuleFor(x => x.strLastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters");

        RuleFor(x => x.strEmail)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(255).WithMessage("Email must not exceed 255 characters");

        RuleFor(x => x.strPhone)
            .MaximumLength(20).WithMessage("Phone must not exceed 20 characters")
            .When(x => !string.IsNullOrEmpty(x.strPhone));

        RuleFor(x => x.strMobilePhone)
            .MaximumLength(20).WithMessage("Mobile phone must not exceed 20 characters")
            .When(x => !string.IsNullOrEmpty(x.strMobilePhone));

        RuleFor(x => x.strJobTitle)
            .MaximumLength(150).WithMessage("Job title must not exceed 150 characters")
            .When(x => !string.IsNullOrEmpty(x.strJobTitle));

        RuleFor(x => x.strDepartment)
            .MaximumLength(100).WithMessage("Department must not exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.strDepartment));

        RuleFor(x => x.strLifecycleStage)
            .Must(stage => stage == null || ContactLifecycleStageConstants.AllStages.Contains(stage))
            .WithMessage($"Lifecycle stage must be one of: {string.Join(", ", ContactLifecycleStageConstants.AllStages)}")
            .When(x => !string.IsNullOrEmpty(x.strLifecycleStage));

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
    }
}
