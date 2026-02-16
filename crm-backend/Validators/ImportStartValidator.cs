using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class ImportStartDtoValidator : AbstractValidator<ImportStartDto>
{
    private static readonly string[] ValidDuplicateHandlingOptions = { "Skip", "Update", "Flag" };

    public ImportStartDtoValidator()
    {
        RuleFor(x => x.strDuplicateHandling)
            .NotEmpty().WithMessage("Duplicate handling strategy is required")
            .Must(value => ValidDuplicateHandlingOptions.Contains(value))
            .WithMessage($"Duplicate handling must be one of: {string.Join(", ", ValidDuplicateHandlingOptions)}");

        RuleFor(x => x.ColumnMapping)
            .NotNull().WithMessage("Column mapping is required")
            .Must(mapping => mapping != null && mapping.Count > 0)
            .WithMessage("Column mapping must contain at least one mapping");
    }
}
