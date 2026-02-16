using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class PipelineCreateDtoValidator : AbstractValidator<CreatePipelineDto>
{
    public PipelineCreateDtoValidator()
    {
        RuleFor(x => x.strPipelineName)
            .NotEmpty().WithMessage("Pipeline name is required")
            .MaximumLength(200).WithMessage("Pipeline name must not exceed 200 characters");

        RuleFor(x => x.strDescription)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.strDescription));

        RuleFor(x => x.Stages)
            .NotEmpty().WithMessage("Pipeline must have at least one stage")
            .Must(s => s != null && s.Count >= 2)
            .WithMessage("Pipeline must have at least 2 stages");

        RuleForEach(x => x.Stages).ChildRules(stage =>
        {
            stage.RuleFor(s => s.strStageName)
                .NotEmpty().WithMessage("Stage name is required")
                .MaximumLength(100).WithMessage("Stage name must not exceed 100 characters");

            stage.RuleFor(s => s.intDisplayOrder)
                .GreaterThan(0).WithMessage("Display order must be greater than 0");

            stage.RuleFor(s => s.intProbabilityPercent)
                .InclusiveBetween(0, 100).WithMessage("Probability percentage must be between 0 and 100");

            stage.RuleFor(s => s.intDefaultDaysToRot)
                .GreaterThanOrEqualTo(0).WithMessage("Days to rot must be non-negative");
        }).When(x => x.Stages != null && x.Stages.Any());

        // Custom validation: Ensure exactly one Won stage
        RuleFor(x => x.Stages)
            .Must(stages => stages != null && stages.Count(s => s.bolIsWonStage) == 1)
            .WithMessage("Pipeline must have exactly one Won stage")
            .When(x => x.Stages != null && x.Stages.Any());

        // Custom validation: Ensure exactly one Lost stage
        RuleFor(x => x.Stages)
            .Must(stages => stages != null && stages.Count(s => s.bolIsLostStage) == 1)
            .WithMessage("Pipeline must have exactly one Lost stage")
            .When(x => x.Stages != null && x.Stages.Any());

        // Custom validation: No duplicate stage names
        RuleFor(x => x.Stages)
            .Must(stages =>
            {
                if (stages == null || !stages.Any()) return true;
                var stageNames = stages.Select(s => s.strStageName?.Trim().ToLower()).ToList();
                return stageNames.Count == stageNames.Distinct().Count();
            })
            .WithMessage("Pipeline cannot have duplicate stage names")
            .When(x => x.Stages != null && x.Stages.Any());
    }
}
