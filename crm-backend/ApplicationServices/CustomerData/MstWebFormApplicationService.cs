using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.Common;
using crm_backend.DTOs.CustomerData;
using crm_backend.Exceptions;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using crm_backend.Models.Wrappers;
using System.Linq.Dynamic.Core;

namespace crm_backend.ApplicationServices.CustomerData;

public class MstWebFormApplicationService : ApplicationServiceBase, IMstWebFormApplicationService
{
    private readonly IWebFormService _webFormService;
    private readonly IAuditLogService _auditLogService;

    public MstWebFormApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        IWebFormService webFormService,
        IAuditLogService auditLogService,
        ILogger<MstWebFormApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _webFormService = webFormService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResponse<WebFormListDto>> GetFormsAsync(WebFormFilterParams filter)
    {
        var query = _unitOfWork.WebForms.Query()
            .Where(f => !f.bolIsDeleted);

        // Apply active filter
        if (filter.bolIsActive.HasValue)
            query = query.Where(f => f.bolIsActive == filter.bolIsActive.Value);

        // Apply search
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.ToLower().Trim();
            query = query.Where(f =>
                f.strFormName.ToLower().Contains(searchTerm) ||
                (f.strFormDescription != null && f.strFormDescription.ToLower().Contains(searchTerm)));
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply sorting
        if (!string.IsNullOrWhiteSpace(filter.SortBy))
        {
            var direction = filter.Ascending ? "ascending" : "descending";
            query = query.OrderBy($"{filter.SortBy} {direction}");
        }
        else
        {
            query = query.OrderByDescending(f => f.dtCreatedOn);
        }

        // Apply pagination
        var items = await query
            .Include(f => f.Fields)
            .Include(f => f.Submissions)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var dtos = items.Select(MapToListDto).ToList();

        return new PagedResponse<WebFormListDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<WebFormDetailDto> GetFormByIdAsync(Guid id)
    {
        var form = await _unitOfWork.WebForms.GetByIdWithFieldsAsync(id);
        if (form == null || form.bolIsDeleted)
            throw new NotFoundException("Web form not found", LeadErrorCodes.WebFormNotFound);

        return MapToDetailDto(form);
    }

    public async Task<WebFormDetailDto> CreateFormAsync(CreateWebFormDto dto)
    {
        var tenantId = GetTenantId();
        var userId = GetCurrentUserId();

        var form = new MstWebForm
        {
            strWebFormGUID = Guid.NewGuid(),
            strGroupGUID = tenantId,
            strFormName = dto.strFormName.Trim(),
            strFormDescription = dto.strDescription?.Trim(),
            strRedirectUrl = dto.strRedirectUrl?.Trim(),
            strThankYouMessage = dto.strThankYouMessage?.Trim(),
            strDefaultSource = dto.strDefaultSource,
            bolCaptchaEnabled = dto.bolCaptchaEnabled,
            strCreatedByGUID = userId,
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true,
            bolIsDeleted = false
        };

        await _unitOfWork.WebForms.AddAsync(form);

        // Create fields
        foreach (var fieldDto in dto.Fields)
        {
            var field = new MstWebFormField
            {
                strWebFormFieldGUID = Guid.NewGuid(),
                strGroupGUID = tenantId,
                strWebFormGUID = form.strWebFormGUID,
                strFieldLabel = fieldDto.strFieldLabel.Trim(),
                strFieldType = fieldDto.strFieldType,
                strMappedLeadField = fieldDto.strMappedLeadField?.Trim() ?? string.Empty,
                bolIsRequired = fieldDto.bolIsRequired,
                strOptionsJson = fieldDto.strOptionsJson,
                intSortOrder = fieldDto.intSortOrder,
                dtCreatedOn = DateTime.UtcNow
            };

            await _unitOfWork.WebFormFields.AddAsync(field);
            form.Fields.Add(field);
        }

        await _unitOfWork.SaveChangesAsync();

        // Audit log
        await _auditLogService.LogAsync(
            EntityTypeConstants.WebForm,
            form.strWebFormGUID,
            "Create",
            JsonSerializer.Serialize(new { dto.strFormName, FieldCount = dto.Fields.Count }),
            userId);

        _logger.LogInformation("Web form created: {FormGUID} by {UserGUID}", form.strWebFormGUID, userId);

        return MapToDetailDto(form);
    }

    public async Task<WebFormDetailDto> UpdateFormAsync(Guid id, UpdateWebFormDto dto)
    {
        var form = await _unitOfWork.WebForms.GetByIdWithFieldsAsync(id);
        if (form == null || form.bolIsDeleted)
            throw new NotFoundException("Web form not found", LeadErrorCodes.WebFormNotFound);

        var userId = GetCurrentUserId();
        var tenantId = GetTenantId();

        // Capture old values for audit
        var oldValues = JsonSerializer.Serialize(new { form.strFormName, form.bolIsActive });

        // Update form properties
        form.strFormName = dto.strFormName.Trim();
        form.strFormDescription = dto.strDescription?.Trim();
        form.strRedirectUrl = dto.strRedirectUrl?.Trim();
        form.strThankYouMessage = dto.strThankYouMessage?.Trim();
        form.strDefaultSource = dto.strDefaultSource;
        form.bolCaptchaEnabled = dto.bolCaptchaEnabled;
        form.bolIsActive = dto.bolIsActive;
        form.strUpdatedByGUID = userId;
        form.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.WebForms.Update(form);

        // Remove existing fields and replace with new ones
        var existingFields = form.Fields.ToList();
        foreach (var existingField in existingFields)
        {
            _unitOfWork.WebFormFields.Delete(existingField);
        }
        form.Fields.Clear();

        // Add updated fields
        foreach (var fieldDto in dto.Fields)
        {
            var field = new MstWebFormField
            {
                strWebFormFieldGUID = Guid.NewGuid(),
                strGroupGUID = tenantId,
                strWebFormGUID = form.strWebFormGUID,
                strFieldLabel = fieldDto.strFieldLabel.Trim(),
                strFieldType = fieldDto.strFieldType,
                strMappedLeadField = fieldDto.strMappedLeadField?.Trim() ?? string.Empty,
                bolIsRequired = fieldDto.bolIsRequired,
                strOptionsJson = fieldDto.strOptionsJson,
                intSortOrder = fieldDto.intSortOrder,
                dtCreatedOn = DateTime.UtcNow
            };

            await _unitOfWork.WebFormFields.AddAsync(field);
            form.Fields.Add(field);
        }

        await _unitOfWork.SaveChangesAsync();

        // Audit log
        var newValues = JsonSerializer.Serialize(new { dto.strFormName, dto.bolIsActive, FieldCount = dto.Fields.Count });
        await _auditLogService.LogAsync(
            EntityTypeConstants.WebForm,
            form.strWebFormGUID,
            "Update",
            JsonSerializer.Serialize(new { Old = oldValues, New = newValues }),
            userId);

        _logger.LogInformation("Web form updated: {FormGUID} by {UserGUID}", form.strWebFormGUID, userId);

        return MapToDetailDto(form);
    }

    public async Task<bool> DeleteFormAsync(Guid id)
    {
        var form = await _unitOfWork.WebForms.GetByIdAsync(id);
        if (form == null || form.bolIsDeleted)
            throw new NotFoundException("Web form not found", LeadErrorCodes.WebFormNotFound);

        var userId = GetCurrentUserId();

        // Soft delete
        form.bolIsDeleted = true;
        form.bolIsActive = false;
        form.strUpdatedByGUID = userId;
        form.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.WebForms.Update(form);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync(
            EntityTypeConstants.WebForm,
            form.strWebFormGUID,
            "Delete",
            null,
            userId);

        _logger.LogInformation("Web form deleted: {FormGUID} by {UserGUID}", form.strWebFormGUID, userId);

        return true;
    }

    public async Task<WebFormEmbedCodeDto> GetEmbedCodeAsync(Guid id)
    {
        var form = await _unitOfWork.WebForms.GetByIdWithFieldsAsync(id);
        if (form == null || form.bolIsDeleted)
            throw new NotFoundException("Web form not found", LeadErrorCodes.WebFormNotFound);

        var formUrl = $"api/crm/web-forms/{form.strWebFormGUID}/submit";

        var html = GenerateEmbedHtml(form, formUrl);

        return new WebFormEmbedCodeDto
        {
            strHtml = html,
            strFormUrl = formUrl
        };
    }

    public async Task<WebFormSubmissionListDto> SubmitFormAsync(
        Guid formId,
        WebFormSubmitDto dto,
        string? ipAddress,
        string? userAgent)
    {
        // Load form with fields
        var form = await _unitOfWork.WebForms.GetByIdWithFieldsAsync(formId);
        if (form == null || form.bolIsDeleted)
            throw new NotFoundException("Web form not found", LeadErrorCodes.WebFormNotFound);

        if (!form.bolIsActive)
            throw new BusinessException("This web form is no longer accepting submissions", LeadErrorCodes.WebFormInactive);

        // Create submission record
        var submission = new MstWebFormSubmission
        {
            strSubmissionGUID = Guid.NewGuid(),
            strGroupGUID = form.strGroupGUID,
            strWebFormGUID = form.strWebFormGUID,
            strSubmittedDataJson = JsonSerializer.Serialize(dto.Fields),
            strIpAddress = ipAddress,
            strUserAgent = userAgent,
            strUtmSource = dto.strUtmSource,
            strUtmMedium = dto.strUtmMedium,
            strUtmCampaign = dto.strUtmCampaign,
            strUtmTerm = dto.strUtmTerm,
            strUtmContent = dto.strUtmContent,
            strStatus = "Processed",
            dtCreatedOn = DateTime.UtcNow
        };

        // Process submission to create/find lead
        var leadGuid = await _webFormService.ProcessSubmissionAsync(form, dto, ipAddress, userAgent);

        if (leadGuid.HasValue)
        {
            submission.strLeadGUID = leadGuid.Value;
            submission.strStatus = "Processed";
        }
        else
        {
            submission.strStatus = "Failed";
            submission.strErrorMessage = "Failed to process lead from submission";
        }

        await _unitOfWork.WebFormSubmissions.AddAsync(submission);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation(
            "Web form submission {SubmissionGUID} for form {FormGUID}, status: {Status}",
            submission.strSubmissionGUID,
            form.strWebFormGUID,
            submission.strStatus);

        return MapToSubmissionListDto(submission);
    }

    public async Task<PagedResponse<WebFormSubmissionListDto>> GetSubmissionsAsync(
        Guid formId,
        PagedRequestDto paging)
    {
        // Verify form exists
        var form = await _unitOfWork.WebForms.GetByIdAsync(formId);
        if (form == null || form.bolIsDeleted)
            throw new NotFoundException("Web form not found", LeadErrorCodes.WebFormNotFound);

        var query = _unitOfWork.WebFormSubmissions.Query()
            .Where(s => s.strWebFormGUID == formId);

        // Apply search
        if (!string.IsNullOrWhiteSpace(paging.Search))
        {
            var searchTerm = paging.Search.ToLower().Trim();
            query = query.Where(s =>
                s.strSubmittedDataJson.ToLower().Contains(searchTerm) ||
                s.strStatus.ToLower().Contains(searchTerm) ||
                (s.strIpAddress != null && s.strIpAddress.Contains(searchTerm)));
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply sorting
        if (!string.IsNullOrWhiteSpace(paging.SortBy))
        {
            var direction = paging.Ascending ? "ascending" : "descending";
            query = query.OrderBy($"{paging.SortBy} {direction}");
        }
        else
        {
            query = query.OrderByDescending(s => s.dtCreatedOn);
        }

        // Apply pagination
        var items = await query
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .ToListAsync();

        var dtos = items.Select(MapToSubmissionListDto).ToList();

        return new PagedResponse<WebFormSubmissionListDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)paging.PageSize)
        };
    }

    // === Mapping Methods ===

    private static WebFormListDto MapToListDto(MstWebForm form)
    {
        return new WebFormListDto
        {
            strWebFormGUID = form.strWebFormGUID,
            strFormName = form.strFormName,
            strDescription = form.strFormDescription,
            strDefaultSource = form.strDefaultSource,
            bolCaptchaEnabled = form.bolCaptchaEnabled,
            bolIsActive = form.bolIsActive,
            dtCreatedOn = form.dtCreatedOn,
            intFieldCount = form.Fields?.Count ?? 0,
            intSubmissionCount = form.Submissions?.Count ?? 0
        };
    }

    private static WebFormDetailDto MapToDetailDto(MstWebForm form)
    {
        return new WebFormDetailDto
        {
            strWebFormGUID = form.strWebFormGUID,
            strFormName = form.strFormName,
            strDescription = form.strFormDescription,
            strDefaultSource = form.strDefaultSource,
            bolCaptchaEnabled = form.bolCaptchaEnabled,
            bolIsActive = form.bolIsActive,
            dtCreatedOn = form.dtCreatedOn,
            intFieldCount = form.Fields?.Count ?? 0,
            intSubmissionCount = form.Submissions?.Count ?? 0,
            strRedirectUrl = form.strRedirectUrl,
            strThankYouMessage = form.strThankYouMessage,
            Fields = form.Fields?
                .OrderBy(f => f.intSortOrder)
                .Select(f => new WebFormFieldDto
                {
                    strWebFormFieldGUID = f.strWebFormFieldGUID,
                    strFieldLabel = f.strFieldLabel,
                    strFieldType = f.strFieldType,
                    strMappedLeadField = f.strMappedLeadField,
                    bolIsRequired = f.bolIsRequired,
                    strOptionsJson = f.strOptionsJson,
                    intSortOrder = f.intSortOrder
                })
                .ToList() ?? new List<WebFormFieldDto>()
        };
    }

    private static WebFormSubmissionListDto MapToSubmissionListDto(MstWebFormSubmission submission)
    {
        return new WebFormSubmissionListDto
        {
            strWebFormSubmissionGUID = submission.strSubmissionGUID,
            strSubmittedDataJson = submission.strSubmittedDataJson,
            strLeadGUID = submission.strLeadGUID,
            strStatus = submission.strStatus,
            strIpAddress = submission.strIpAddress,
            dtCreatedOn = submission.dtCreatedOn,
            strUtmSource = submission.strUtmSource,
            strUtmMedium = submission.strUtmMedium,
            strUtmCampaign = submission.strUtmCampaign
        };
    }

    private static string GenerateEmbedHtml(MstWebForm form, string formUrl)
    {
        var sb = new StringBuilder();

        sb.AppendLine($"<!-- CRM Web Form: {System.Net.WebUtility.HtmlEncode(form.strFormName)} -->");
        sb.AppendLine($"<form id=\"crm-webform-{form.strWebFormGUID}\" action=\"{formUrl}\" method=\"POST\">");
        sb.AppendLine($"  <h2>{System.Net.WebUtility.HtmlEncode(form.strFormName)}</h2>");

        if (!string.IsNullOrWhiteSpace(form.strFormDescription))
        {
            sb.AppendLine($"  <p>{System.Net.WebUtility.HtmlEncode(form.strFormDescription)}</p>");
        }

        var orderedFields = form.Fields.OrderBy(f => f.intSortOrder).ToList();

        foreach (var field in orderedFields)
        {
            var encodedLabel = System.Net.WebUtility.HtmlEncode(field.strFieldLabel);
            var requiredAttr = field.bolIsRequired ? " required" : "";
            var requiredMark = field.bolIsRequired ? " *" : "";

            sb.AppendLine("  <div class=\"form-group\">");

            switch (field.strFieldType)
            {
                case WebFormFieldTypeConstants.Hidden:
                    sb.AppendLine($"    <input type=\"hidden\" name=\"{encodedLabel}\" value=\"{System.Net.WebUtility.HtmlEncode(field.strDefaultValue ?? "")}\" />");
                    break;

                case WebFormFieldTypeConstants.TextArea:
                    sb.AppendLine($"    <label for=\"field-{field.strWebFormFieldGUID}\">{encodedLabel}{requiredMark}</label>");
                    sb.AppendLine($"    <textarea id=\"field-{field.strWebFormFieldGUID}\" name=\"{encodedLabel}\" rows=\"4\"{requiredAttr}></textarea>");
                    break;

                case WebFormFieldTypeConstants.Dropdown:
                    sb.AppendLine($"    <label for=\"field-{field.strWebFormFieldGUID}\">{encodedLabel}{requiredMark}</label>");
                    sb.AppendLine($"    <select id=\"field-{field.strWebFormFieldGUID}\" name=\"{encodedLabel}\"{requiredAttr}>");
                    sb.AppendLine("      <option value=\"\">-- Select --</option>");
                    if (!string.IsNullOrWhiteSpace(field.strOptionsJson))
                    {
                        try
                        {
                            var options = JsonSerializer.Deserialize<List<string>>(field.strOptionsJson);
                            if (options != null)
                            {
                                foreach (var option in options)
                                {
                                    var encodedOption = System.Net.WebUtility.HtmlEncode(option);
                                    sb.AppendLine($"      <option value=\"{encodedOption}\">{encodedOption}</option>");
                                }
                            }
                        }
                        catch
                        {
                            // Ignore malformed options JSON
                        }
                    }
                    sb.AppendLine("    </select>");
                    break;

                case WebFormFieldTypeConstants.Email:
                    sb.AppendLine($"    <label for=\"field-{field.strWebFormFieldGUID}\">{encodedLabel}{requiredMark}</label>");
                    sb.AppendLine($"    <input type=\"email\" id=\"field-{field.strWebFormFieldGUID}\" name=\"{encodedLabel}\"{requiredAttr} />");
                    break;

                case WebFormFieldTypeConstants.Phone:
                    sb.AppendLine($"    <label for=\"field-{field.strWebFormFieldGUID}\">{encodedLabel}{requiredMark}</label>");
                    sb.AppendLine($"    <input type=\"tel\" id=\"field-{field.strWebFormFieldGUID}\" name=\"{encodedLabel}\"{requiredAttr} />");
                    break;

                default: // Text
                    sb.AppendLine($"    <label for=\"field-{field.strWebFormFieldGUID}\">{encodedLabel}{requiredMark}</label>");
                    sb.AppendLine($"    <input type=\"text\" id=\"field-{field.strWebFormFieldGUID}\" name=\"{encodedLabel}\"{requiredAttr} />");
                    break;
            }

            sb.AppendLine("  </div>");
        }

        sb.AppendLine("  <div class=\"form-group\">");
        sb.AppendLine("    <button type=\"submit\">Submit</button>");
        sb.AppendLine("  </div>");
        sb.AppendLine("</form>");

        return sb.ToString();
    }
}
