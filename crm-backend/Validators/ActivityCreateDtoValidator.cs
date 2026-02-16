using FluentValidation;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class ActivityCreateDtoValidator : AbstractValidator<CreateActivityDto>
{
    public ActivityCreateDtoValidator()
    {
        RuleFor(x => x.strActivityType)
            .NotEmpty().WithMessage("Activity type is required")
            .Must(type => ActivityTypeConstants.AllTypes.Contains(type))
            .WithMessage($"Activity type must be one of: {string.Join(", ", ActivityTypeConstants.AllTypes)}");

        RuleFor(x => x.strSubject)
            .NotEmpty().WithMessage("Subject is required")
            .MaximumLength(300).WithMessage("Subject must not exceed 300 characters");

        RuleFor(x => x.strDescription)
            .MaximumLength(4000).WithMessage("Description must not exceed 4000 characters")
            .When(x => !string.IsNullOrEmpty(x.strDescription));

        RuleFor(x => x.intDurationMinutes)
            .InclusiveBetween(0, 1440).WithMessage("Duration must be between 0 and 1440 minutes")
            .When(x => x.intDurationMinutes.HasValue);

        RuleFor(x => x.strOutcome)
            .MaximumLength(200).WithMessage("Outcome must not exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.strOutcome));

        RuleForEach(x => x.Links).ChildRules(link =>
        {
            link.RuleFor(l => l.strEntityType)
                .NotEmpty().WithMessage("Entity type is required for each link")
                .Must(type => EntityTypeConstants.AllTypes.Contains(type))
                .WithMessage($"Entity type must be one of: {string.Join(", ", EntityTypeConstants.AllTypes)}");

            link.RuleFor(l => l.strEntityGUID)
                .NotEqual(Guid.Empty).WithMessage("Entity GUID cannot be empty");
        });
    }
}
