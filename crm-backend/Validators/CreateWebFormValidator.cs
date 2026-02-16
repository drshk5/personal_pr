using FluentValidation;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class CreateWebFormValidator : AbstractValidator<CreateWebFormDto>
{
    public CreateWebFormValidator()
    {
        RuleFor(x => x.strFormName)
            .NotEmpty().WithMessage("Form name is required")
            .MaximumLength(200).WithMessage("Form name must not exceed 200 characters");

        RuleFor(x => x.strDescription)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters")
            .When(x => !string.IsNullOrEmpty(x.strDescription));

        RuleFor(x => x.strRedirectUrl)
            .MaximumLength(500).WithMessage("Redirect URL must not exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.strRedirectUrl));

        RuleFor(x => x.strThankYouMessage)
            .MaximumLength(2000).WithMessage("Thank you message must not exceed 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.strThankYouMessage));

        RuleFor(x => x.strDefaultSource)
            .NotEmpty().WithMessage("Default source is required");

        RuleFor(x => x.Fields)
            .NotNull().WithMessage("Fields are required")
            .NotEmpty().WithMessage("At least one field is required");

        RuleForEach(x => x.Fields).ChildRules(field =>
        {
            field.RuleFor(f => f.strFieldLabel)
                .NotEmpty().WithMessage("Field label is required")
                .MaximumLength(200).WithMessage("Field label must not exceed 200 characters");

            field.RuleFor(f => f.strFieldType)
                .NotEmpty().WithMessage("Field type is required")
                .Must(type => WebFormFieldTypeConstants.AllTypes.Contains(type))
                .WithMessage($"Field type must be one of: {string.Join(", ", WebFormFieldTypeConstants.AllTypes)}");

            field.RuleFor(f => f.strMappedLeadField)
                .MaximumLength(100).WithMessage("Mapped lead field must not exceed 100 characters")
                .When(f => !string.IsNullOrEmpty(f.strMappedLeadField));

            field.RuleFor(f => f.strOptionsJson)
                .MaximumLength(4000).WithMessage("Options JSON must not exceed 4000 characters")
                .When(f => !string.IsNullOrEmpty(f.strOptionsJson));

            field.RuleFor(f => f.intSortOrder)
                .GreaterThanOrEqualTo(0).WithMessage("Sort order must be a non-negative number");
        });
    }
}
