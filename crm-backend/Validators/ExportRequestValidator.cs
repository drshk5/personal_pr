using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class ExportRequestDtoValidator : AbstractValidator<ExportRequestDto>
{
    private static readonly HashSet<string> ValidLeadFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "strFirstName",
        "strLastName",
        "strEmail",
        "strPhone",
        "strCompanyName",
        "strJobTitle",
        "strSource",
        "strStatus",
        "intLeadScore",
        "strAddress",
        "strCity",
        "strState",
        "strCountry",
        "strPostalCode",
        "strNotes",
        "strAssignedToGUID",
        "dtCreatedOn",
        "bolIsActive"
    };

    public ExportRequestDtoValidator()
    {
        RuleFor(x => x.Columns)
            .Must(columns => columns == null || columns.All(c => ValidLeadFields.Contains(c)))
            .WithMessage($"Each column must be a valid lead field. Valid fields: {string.Join(", ", ValidLeadFields)}");

        RuleFor(x => x.dtFromDate)
            .LessThanOrEqualTo(x => x.dtToDate)
            .When(x => x.dtFromDate.HasValue && x.dtToDate.HasValue)
            .WithMessage("From date must be before or equal to To date");

        RuleFor(x => x.intMinScore)
            .LessThanOrEqualTo(x => x.intMaxScore)
            .When(x => x.intMinScore.HasValue && x.intMaxScore.HasValue)
            .WithMessage("Minimum score must be less than or equal to maximum score");
    }
}
