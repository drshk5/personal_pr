using System.Globalization;
using System.Text.Json;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using crm_backend.Constants;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Helpers;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Services.CustomerData;

public class MstImportExportService : IImportExportService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILeadScoringService _leadScoringService;
    private readonly ILogger<MstImportExportService> _logger;

    // All available lead fields for mapping
    private static readonly List<string> AvailableLeadFields = new()
    {
        "strFirstName",
        "strLastName",
        "strEmail",
        "strPhone",
        "strCompanyName",
        "strJobTitle",
        "strSource",
        "strAddress",
        "strCity",
        "strState",
        "strCountry",
        "strPostalCode",
        "strNotes"
    };

    // Header-to-field matching rules (case-insensitive contains)
    private static readonly List<(string[] Keywords, string FieldName)> HeaderMappingRules = new()
    {
        (new[] { "first", "fname" }, "strFirstName"),
        (new[] { "last", "lname" }, "strLastName"),
        (new[] { "email" }, "strEmail"),
        (new[] { "phone" }, "strPhone"),
        (new[] { "company" }, "strCompanyName"),
        (new[] { "title", "job" }, "strJobTitle"),
        (new[] { "source" }, "strSource"),
        (new[] { "city" }, "strCity"),
        (new[] { "state" }, "strState"),
        (new[] { "country" }, "strCountry"),
        (new[] { "zip", "postal" }, "strPostalCode"),
        (new[] { "note" }, "strNotes"),
        (new[] { "address" }, "strAddress")
    };

    public MstImportExportService(
        IUnitOfWork unitOfWork,
        ILeadScoringService leadScoringService,
        ILogger<MstImportExportService> logger)
    {
        _unitOfWork = unitOfWork;
        _leadScoringService = leadScoringService;
        _logger = logger;
    }

    public async Task<ImportJobListDto> StartImportAsync(
        Stream csvStream,
        string fileName,
        ImportStartDto settings,
        Guid tenantId,
        Guid userId)
    {
        // Create the import job
        var importJob = new MstImportJob
        {
            strImportJobGUID = Guid.NewGuid(),
            strGroupGUID = tenantId,
            strFileName = fileName,
            strStatus = ImportStatusConstants.Processing,
            strDuplicateHandling = settings.strDuplicateHandling,
            strColumnMappingJson = JsonSerializer.Serialize(settings.ColumnMapping),
            strCreatedByGUID = userId,
            dtCreatedOn = DateTime.UtcNow
        };

        await _unitOfWork.ImportJobs.AddAsync(importJob);
        await _unitOfWork.SaveChangesAsync();

        try
        {
            using var reader = new StreamReader(csvStream);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                MissingFieldFound = null,
                HeaderValidated = null,
                BadDataFound = null
            });

            await csv.ReadAsync();
            csv.ReadHeader();
            var headers = csv.HeaderRecord ?? Array.Empty<string>();

            int rowNumber = 0;

            while (await csv.ReadAsync())
            {
                rowNumber++;
                importJob.intTotalRows = rowNumber;
                importJob.intProcessedRows = rowNumber;

                try
                {
                    // Map CSV columns to a dictionary of lead field values
                    var fieldValues = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
                    foreach (var mapping in settings.ColumnMapping)
                    {
                        var csvColumn = mapping.Key;
                        var leadField = mapping.Value;

                        string? value = null;
                        try
                        {
                            value = csv.GetField(csvColumn);
                        }
                        catch
                        {
                            // Column not found in this row, skip
                        }

                        fieldValues[leadField] = value;
                    }

                    // Extract required fields
                    var firstName = GetFieldValue(fieldValues, "strFirstName");
                    var lastName = GetFieldValue(fieldValues, "strLastName");
                    var email = GetFieldValue(fieldValues, "strEmail");

                    // Validate required fields
                    var validationErrors = new List<string>();
                    if (string.IsNullOrWhiteSpace(firstName))
                        validationErrors.Add("First name is required");
                    if (string.IsNullOrWhiteSpace(lastName))
                        validationErrors.Add("Last name is required");
                    if (string.IsNullOrWhiteSpace(email))
                        validationErrors.Add("Email is required");

                    if (validationErrors.Count > 0)
                    {
                        await RecordErrorAsync(importJob, rowNumber, fieldValues, string.Join("; ", validationErrors), "Validation", tenantId);
                        importJob.intErrorRows++;
                        continue;
                    }

                    // Normalize email and phone
                    var normalizedEmail = DataNormalizationHelper.NormalizeEmail(email!);
                    var normalizedPhone = DataNormalizationHelper.NormalizePhone(GetFieldValue(fieldValues, "strPhone"));

                    // Check for duplicate by email
                    var existingLead = await _unitOfWork.Leads.GetByEmailAsync(normalizedEmail, tenantId);

                    if (existingLead != null)
                    {
                        switch (settings.strDuplicateHandling)
                        {
                            case "Skip":
                                importJob.intDuplicateRows++;
                                continue;

                            case "Update":
                                UpdateExistingLead(existingLead, fieldValues, normalizedEmail, normalizedPhone, userId);
                                existingLead.intLeadScore = await _leadScoringService.CalculateScoreAsync(existingLead);
                                _unitOfWork.Leads.Update(existingLead);
                                importJob.intDuplicateRows++;
                                importJob.intSuccessRows++;
                                await _unitOfWork.SaveChangesAsync();
                                continue;

                            case "Flag":
                                // Create the lead anyway but record it as duplicate
                                var flaggedLead = CreateLeadFromFields(fieldValues, normalizedEmail, normalizedPhone, tenantId, userId);
                                flaggedLead.intLeadScore = await _leadScoringService.CalculateScoreAsync(flaggedLead);
                                await _unitOfWork.Leads.AddAsync(flaggedLead);
                                await RecordErrorAsync(importJob, rowNumber, fieldValues,
                                    $"Duplicate email found: {normalizedEmail}", "Duplicate", tenantId);
                                importJob.intDuplicateRows++;
                                importJob.intSuccessRows++;
                                await _unitOfWork.SaveChangesAsync();
                                continue;
                        }
                    }

                    // Create new lead
                    var newLead = CreateLeadFromFields(fieldValues, normalizedEmail, normalizedPhone, tenantId, userId);
                    newLead.intLeadScore = await _leadScoringService.CalculateScoreAsync(newLead);
                    await _unitOfWork.Leads.AddAsync(newLead);
                    importJob.intSuccessRows++;
                    await _unitOfWork.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing row {RowNumber} in import job {JobId}", rowNumber, importJob.strImportJobGUID);
                    await RecordErrorAsync(importJob, rowNumber, null, $"System error: {ex.Message}", "System", tenantId);
                    importJob.intErrorRows++;
                }
            }

            // Set total rows if file was empty
            if (rowNumber == 0)
            {
                importJob.intTotalRows = 0;
                importJob.intProcessedRows = 0;
            }

            // Determine final status
            importJob.strStatus = importJob.intSuccessRows == 0 && importJob.intTotalRows > 0
                ? ImportStatusConstants.Failed
                : ImportStatusConstants.Completed;
            importJob.dtCompletedOn = DateTime.UtcNow;

            _unitOfWork.ImportJobs.Update(importJob);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation(
                "Import job {JobId} completed. Total: {Total}, Success: {Success}, Errors: {Errors}, Duplicates: {Duplicates}",
                importJob.strImportJobGUID, importJob.intTotalRows, importJob.intSuccessRows,
                importJob.intErrorRows, importJob.intDuplicateRows);

            return MapToListDto(importJob);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Import job {JobId} failed with exception", importJob.strImportJobGUID);
            importJob.strStatus = ImportStatusConstants.Failed;
            importJob.dtCompletedOn = DateTime.UtcNow;
            _unitOfWork.ImportJobs.Update(importJob);
            await _unitOfWork.SaveChangesAsync();
            throw;
        }
    }

    public async Task<ImportSuggestMappingResultDto> SuggestMappingAsync(Stream csvStream)
    {
        using var reader = new StreamReader(csvStream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            HeaderValidated = null
        });

        await csv.ReadAsync();
        csv.ReadHeader();
        var headers = csv.HeaderRecord?.ToList() ?? new List<string>();

        var suggestedMapping = new Dictionary<string, string>();
        var usedFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var header in headers)
        {
            var headerLower = header.ToLowerInvariant();

            foreach (var (keywords, fieldName) in HeaderMappingRules)
            {
                if (usedFields.Contains(fieldName))
                    continue;

                if (keywords.Any(k => headerLower.Contains(k)))
                {
                    suggestedMapping[header] = fieldName;
                    usedFields.Add(fieldName);
                    break;
                }
            }
        }

        return new ImportSuggestMappingResultDto
        {
            SuggestedMapping = suggestedMapping,
            CsvHeaders = headers,
            AvailableLeadFields = AvailableLeadFields
        };
    }

    public async Task<byte[]> ExportLeadsAsync(ExportRequestDto filter, Guid tenantId)
    {
        var query = _unitOfWork.Leads.Query()
            .Where(l => !l.bolIsDeleted);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(filter.strStatus))
            query = query.Where(l => l.strStatus == filter.strStatus);

        if (!string.IsNullOrWhiteSpace(filter.strSource))
            query = query.Where(l => l.strSource == filter.strSource);

        if (filter.strAssignedToGUID.HasValue)
            query = query.Where(l => l.strAssignedToGUID == filter.strAssignedToGUID.Value);

        if (filter.dtFromDate.HasValue)
            query = query.Where(l => l.dtCreatedOn >= filter.dtFromDate.Value);

        if (filter.dtToDate.HasValue)
            query = query.Where(l => l.dtCreatedOn <= filter.dtToDate.Value);

        if (filter.intMinScore.HasValue)
            query = query.Where(l => l.intLeadScore >= filter.intMinScore.Value);

        if (filter.intMaxScore.HasValue)
            query = query.Where(l => l.intLeadScore <= filter.intMaxScore.Value);

        var leads = await query.OrderByDescending(l => l.dtCreatedOn).ToListAsync();

        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));

        var specificColumns = filter.Columns != null && filter.Columns.Count > 0;

        if (specificColumns)
        {
            // Write only selected column headers
            foreach (var column in filter.Columns!)
            {
                csv.WriteField(column);
            }
            await csv.NextRecordAsync();

            // Write rows with only selected columns
            foreach (var lead in leads)
            {
                foreach (var column in filter.Columns!)
                {
                    csv.WriteField(GetLeadFieldValue(lead, column));
                }
                await csv.NextRecordAsync();
            }
        }
        else
        {
            // Write all standard field headers
            var allFields = new List<string>
            {
                "strFirstName", "strLastName", "strEmail", "strPhone",
                "strCompanyName", "strJobTitle", "strSource", "strStatus",
                "intLeadScore", "strAddress", "strCity", "strState",
                "strCountry", "strPostalCode", "strNotes",
                "strAssignedToGUID", "dtCreatedOn", "bolIsActive"
            };

            foreach (var field in allFields)
            {
                csv.WriteField(field);
            }
            await csv.NextRecordAsync();

            // Write rows
            foreach (var lead in leads)
            {
                foreach (var field in allFields)
                {
                    csv.WriteField(GetLeadFieldValue(lead, field));
                }
                await csv.NextRecordAsync();
            }
        }

        await writer.FlushAsync();
        return memoryStream.ToArray();
    }

    // === Private Helpers ===

    private static string? GetFieldValue(Dictionary<string, string?> fieldValues, string fieldName)
    {
        return fieldValues.TryGetValue(fieldName, out var value) ? value : null;
    }

    private static MstLead CreateLeadFromFields(
        Dictionary<string, string?> fieldValues,
        string normalizedEmail,
        string? normalizedPhone,
        Guid tenantId,
        Guid userId)
    {
        var source = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strSource"));
        var validSource = !string.IsNullOrEmpty(source) && LeadSourceConstants.AllSources.Contains(source)
            ? source
            : LeadSourceConstants.Other;

        return new MstLead
        {
            strLeadGUID = Guid.NewGuid(),
            strGroupGUID = tenantId,
            strFirstName = GetFieldValue(fieldValues, "strFirstName")?.Trim() ?? string.Empty,
            strLastName = GetFieldValue(fieldValues, "strLastName")?.Trim() ?? string.Empty,
            strEmail = normalizedEmail,
            strPhone = normalizedPhone,
            strCompanyName = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCompanyName")),
            strJobTitle = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strJobTitle")),
            strSource = validSource,
            strStatus = LeadStatusConstants.New,
            strAddress = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strAddress")),
            strCity = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCity")),
            strState = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strState")),
            strCountry = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCountry")),
            strPostalCode = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strPostalCode")),
            strNotes = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strNotes")),
            strCreatedByGUID = userId,
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true,
            bolIsDeleted = false
        };
    }

    private static void UpdateExistingLead(
        MstLead lead,
        Dictionary<string, string?> fieldValues,
        string normalizedEmail,
        string? normalizedPhone,
        Guid userId)
    {
        var firstName = GetFieldValue(fieldValues, "strFirstName");
        if (!string.IsNullOrWhiteSpace(firstName))
            lead.strFirstName = firstName.Trim();

        var lastName = GetFieldValue(fieldValues, "strLastName");
        if (!string.IsNullOrWhiteSpace(lastName))
            lead.strLastName = lastName.Trim();

        lead.strEmail = normalizedEmail;
        lead.strPhone = normalizedPhone ?? lead.strPhone;

        var companyName = GetFieldValue(fieldValues, "strCompanyName");
        if (!string.IsNullOrWhiteSpace(companyName))
            lead.strCompanyName = DataNormalizationHelper.TrimOrNull(companyName);

        var jobTitle = GetFieldValue(fieldValues, "strJobTitle");
        if (!string.IsNullOrWhiteSpace(jobTitle))
            lead.strJobTitle = DataNormalizationHelper.TrimOrNull(jobTitle);

        var source = GetFieldValue(fieldValues, "strSource");
        if (!string.IsNullOrWhiteSpace(source) && LeadSourceConstants.AllSources.Contains(source))
            lead.strSource = source;

        var address = GetFieldValue(fieldValues, "strAddress");
        if (!string.IsNullOrWhiteSpace(address))
            lead.strAddress = DataNormalizationHelper.TrimOrNull(address);

        var city = GetFieldValue(fieldValues, "strCity");
        if (!string.IsNullOrWhiteSpace(city))
            lead.strCity = DataNormalizationHelper.TrimOrNull(city);

        var state = GetFieldValue(fieldValues, "strState");
        if (!string.IsNullOrWhiteSpace(state))
            lead.strState = DataNormalizationHelper.TrimOrNull(state);

        var country = GetFieldValue(fieldValues, "strCountry");
        if (!string.IsNullOrWhiteSpace(country))
            lead.strCountry = DataNormalizationHelper.TrimOrNull(country);

        var postalCode = GetFieldValue(fieldValues, "strPostalCode");
        if (!string.IsNullOrWhiteSpace(postalCode))
            lead.strPostalCode = DataNormalizationHelper.TrimOrNull(postalCode);

        var notes = GetFieldValue(fieldValues, "strNotes");
        if (!string.IsNullOrWhiteSpace(notes))
            lead.strNotes = DataNormalizationHelper.TrimOrNull(notes);

        lead.strUpdatedByGUID = userId;
        lead.dtUpdatedOn = DateTime.UtcNow;
    }

    private async Task RecordErrorAsync(
        MstImportJob importJob,
        int rowNumber,
        Dictionary<string, string?>? fieldValues,
        string errorMessage,
        string errorType,
        Guid tenantId)
    {
        var error = new MstImportJobError
        {
            strImportJobErrorGUID = Guid.NewGuid(),
            strGroupGUID = tenantId,
            strImportJobGUID = importJob.strImportJobGUID,
            intRowNumber = rowNumber,
            strRawDataJson = fieldValues != null ? JsonSerializer.Serialize(fieldValues) : null,
            strErrorMessage = errorMessage,
            strErrorType = errorType,
            dtCreatedOn = DateTime.UtcNow
        };

        await _unitOfWork.ImportJobErrors.AddAsync(error);
        await _unitOfWork.SaveChangesAsync();
    }

    private static string? GetLeadFieldValue(MstLead lead, string fieldName)
    {
        return fieldName switch
        {
            "strFirstName" => lead.strFirstName,
            "strLastName" => lead.strLastName,
            "strEmail" => lead.strEmail,
            "strPhone" => lead.strPhone,
            "strCompanyName" => lead.strCompanyName,
            "strJobTitle" => lead.strJobTitle,
            "strSource" => lead.strSource,
            "strStatus" => lead.strStatus,
            "intLeadScore" => lead.intLeadScore.ToString(),
            "strAddress" => lead.strAddress,
            "strCity" => lead.strCity,
            "strState" => lead.strState,
            "strCountry" => lead.strCountry,
            "strPostalCode" => lead.strPostalCode,
            "strNotes" => lead.strNotes,
            "strAssignedToGUID" => lead.strAssignedToGUID?.ToString(),
            "dtCreatedOn" => lead.dtCreatedOn.ToString("o"),
            "bolIsActive" => lead.bolIsActive.ToString(),
            _ => null
        };
    }

    private static ImportJobListDto MapToListDto(MstImportJob job)
    {
        return new ImportJobListDto
        {
            strImportJobGUID = job.strImportJobGUID,
            strFileName = job.strFileName,
            strStatus = job.strStatus,
            intTotalRows = job.intTotalRows,
            intProcessedRows = job.intProcessedRows,
            intSuccessRows = job.intSuccessRows,
            intErrorRows = job.intErrorRows,
            intDuplicateRows = job.intDuplicateRows,
            strDuplicateHandling = job.strDuplicateHandling,
            dtCreatedOn = job.dtCreatedOn,
            dtCompletedOn = job.dtCompletedOn
        };
    }
}
