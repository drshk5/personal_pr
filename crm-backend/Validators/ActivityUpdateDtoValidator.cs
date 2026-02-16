using FluentValidation;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class ActivityUpdateDtoValidator : AbstractValidator<UpdateActivityDto>
{
    public ActivityUpdateDtoValidator()
    {
        RuleFor(x => x.strActivityType)
            .NotEmpty().WithMessage("Activity type is required")
            .Must(t => ActivityTypeConstants.AllTypes.Contains(t))
            .WithMessage($"Activity type must be one of: {string.Join(", ", ActivityTypeConstants.AllTypes)}");

        RuleFor(x => x.strSubject)
            .NotEmpty().WithMessage("Subject is required")
            .MaximumLength(200).WithMessage("Subject cannot exceed 200 characters");

        RuleFor(x => x.strDescription)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");

        RuleFor(x => x.strStatus)
            .Must(s => s == null || ActivityStatusConstants.AllStatuses.Contains(s))
            .WithMessage($"Status must be one of: {string.Join(", ", ActivityStatusConstants.AllStatuses)}");

        RuleFor(x => x.strPriority)
            .Must(p => p == null || ActivityPriorityConstants.AllPriorities.Contains(p))
            .WithMessage($"Priority must be one of: {string.Join(", ", ActivityPriorityConstants.AllPriorities)}");

        RuleFor(x => x.strCategory)
            .Must(c => c == null || ActivityCategoryConstants.AllCategories.Contains(c))
            .WithMessage($"Category must be one of: {string.Join(", ", ActivityCategoryConstants.AllCategories)}");

        RuleFor(x => x.intDurationMinutes)
            .GreaterThan(0).When(x => x.intDurationMinutes.HasValue)
            .WithMessage("Duration must be greater than 0");

        RuleFor(x => x.strOutcome)
            .MaximumLength(500).WithMessage("Outcome cannot exceed 500 characters");
    }
}
