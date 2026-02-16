using crm_backend.Constants;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Services.CustomerData;

public class MstWebFormService : IWebFormService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILeadScoringService _leadScoringService;
    private readonly ILeadAssignmentService _leadAssignmentService;
    private readonly ILeadDuplicateService _leadDuplicateService;
    private readonly ILogger<MstWebFormService> _logger;

    public MstWebFormService(
        IUnitOfWork unitOfWork,
        ILeadScoringService leadScoringService,
        ILeadAssignmentService leadAssignmentService,
        ILeadDuplicateService leadDuplicateService,
        ILogger<MstWebFormService> logger)
    {
        _unitOfWork = unitOfWork;
        _leadScoringService = leadScoringService;
        _leadAssignmentService = leadAssignmentService;
        _leadDuplicateService = leadDuplicateService;
        _logger = logger;
    }

    public async Task<Guid?> ProcessSubmissionAsync(
        MstWebForm form,
        WebFormSubmitDto submission,
        string? ipAddress,
        string? userAgent)
    {
        try
        {
            // 1. Map submitted fields to lead properties using form field definitions
            var lead = MapSubmissionToLead(form, submission);

            // 2. Set default properties from form
            lead.strSource = form.strDefaultSource;
            lead.strStatus = LeadStatusConstants.New;
            lead.strGroupGUID = form.strGroupGUID;
            lead.strCreatedByGUID = form.strCreatedByGUID; // Form owner / system user

            // 3. Check for existing lead by email to avoid duplicates
            if (!string.IsNullOrWhiteSpace(lead.strEmail))
            {
                var existingLead = await _unitOfWork.Leads.GetByEmailAsync(
                    lead.strEmail.ToLowerInvariant(),
                    form.strGroupGUID);

                if (existingLead != null)
                {
                    _logger.LogInformation(
                        "Web form submission matched existing lead {LeadGUID} by email {Email}",
                        existingLead.strLeadGUID,
                        lead.strEmail);
                    return existingLead.strLeadGUID;
                }
            }

            // 4. New lead: calculate score
            lead.strLeadGUID = Guid.NewGuid();
            lead.dtCreatedOn = DateTime.UtcNow;
            lead.bolIsActive = true;
            lead.bolIsDeleted = false;

            lead.intLeadScore = await _leadScoringService.CalculateScoreAsync(lead);

            // 5. Try auto-assignment
            try
            {
                var assignmentResult = await _leadAssignmentService.AssignLeadAsync(lead);
                if (assignmentResult != null && assignmentResult.strAssignedToGUID.HasValue)
                {
                    lead.strAssignedToGUID = assignmentResult.strAssignedToGUID;
                    _logger.LogInformation(
                        "Lead {LeadGUID} auto-assigned to {AssignedTo} via {Method}",
                        lead.strLeadGUID,
                        assignmentResult.strAssignedToGUID,
                        assignmentResult.strAssignmentMethod);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Auto-assignment failed for web form lead {LeadGUID}", lead.strLeadGUID);
            }

            // 6. Save lead
            await _unitOfWork.Leads.AddAsync(lead);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation(
                "New lead {LeadGUID} created from web form {FormGUID} submission",
                lead.strLeadGUID,
                form.strWebFormGUID);

            // 7. Check for duplicates (non-blocking)
            _ = Task.Run(async () =>
            {
                try
                {
                    await _leadDuplicateService.CheckForDuplicatesAsync(lead);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Duplicate check failed for lead {LeadGUID} from web form",
                        lead.strLeadGUID);
                }
            });

            return lead.strLeadGUID;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to process web form submission for form {FormGUID}",
                form.strWebFormGUID);
            return null;
        }
    }

    private static MstLead MapSubmissionToLead(MstWebForm form, WebFormSubmitDto submission)
    {
        var lead = new MstLead();

        // Build a lookup from field label to submitted value
        var submittedValues = submission.Fields ?? new Dictionary<string, string>();

        foreach (var field in form.Fields)
        {
            // Try to find the submitted value by field label
            if (!submittedValues.TryGetValue(field.strFieldLabel, out var value))
                continue;

            if (string.IsNullOrWhiteSpace(value))
                continue;

            var trimmedValue = value.Trim();

            // Map to lead property based on strMappedLeadField
            if (string.IsNullOrWhiteSpace(field.strMappedLeadField))
                continue;

            switch (field.strMappedLeadField.Trim())
            {
                case "strFirstName":
                    lead.strFirstName = trimmedValue;
                    break;
                case "strLastName":
                    lead.strLastName = trimmedValue;
                    break;
                case "strEmail":
                    lead.strEmail = trimmedValue.ToLowerInvariant();
                    break;
                case "strPhone":
                    lead.strPhone = trimmedValue;
                    break;
                case "strCompanyName":
                    lead.strCompanyName = trimmedValue;
                    break;
                case "strJobTitle":
                    lead.strJobTitle = trimmedValue;
                    break;
                case "strAddress":
                    lead.strAddress = trimmedValue;
                    break;
                case "strCity":
                    lead.strCity = trimmedValue;
                    break;
                case "strState":
                    lead.strState = trimmedValue;
                    break;
                case "strCountry":
                    lead.strCountry = trimmedValue;
                    break;
                case "strPostalCode":
                    lead.strPostalCode = trimmedValue;
                    break;
                case "strNotes":
                    lead.strNotes = trimmedValue;
                    break;
                default:
                    // Unmapped field - append to notes
                    if (string.IsNullOrEmpty(lead.strNotes))
                        lead.strNotes = $"{field.strFieldLabel}: {trimmedValue}";
                    else
                        lead.strNotes += $"\n{field.strFieldLabel}: {trimmedValue}";
                    break;
            }
        }

        return lead;
    }
}
