using FluentValidation;
using crm_backend.DTOs.CustomerData;

namespace crm_backend.Validators;

public class UpdateWebFormValidator : AbstractValidator<UpdateWebFormDto>
{
    public UpdateWebFormValidator()
    {
        Include(new CreateWebFormValidator());
    }
}
