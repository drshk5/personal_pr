using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class LeadMergeRequestValidator : AbstractValidator<LeadMergeRequestDto>
{
    public LeadMergeRequestValidator()
    {
        RuleFor(x => x.strSurvivorLeadGUID).NotEmpty();
        RuleFor(x => x.strMergedLeadGUID).NotEmpty();
        RuleFor(x => x.strSurvivorLeadGUID).NotEqual(x => x.strMergedLeadGUID).WithMessage("Cannot merge a lead with itself");
    }
}
