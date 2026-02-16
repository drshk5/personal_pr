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
    private const int BulkSaveBatchSize = 1000;
    private const int InClauseBatchSize = 1000;

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

    private static readonly List<string> AvailableContactFields = new()
    {
        "strAccountGUID",
        "strFirstName",
        "strLastName",
        "strEmail",
        "strPhone",
        "strMobilePhone",
        "strJobTitle",
        "strDepartment",
        "strLifecycleStage",
        "strAddress",
        "strCity",
        "strState",
        "strCountry",
        "strPostalCode",
        "strNotes",
        "strAssignedToGUID"
    };

    private static readonly List<(string[] Keywords, string FieldName)> ContactHeaderMappingRules = new()
    {
        (new[] { "accountguid", "account_id", "accountid" }, "strAccountGUID"),
        (new[] { "first", "fname" }, "strFirstName"),
        (new[] { "last", "lname" }, "strLastName"),
        (new[] { "email" }, "strEmail"),
        (new[] { "mobile", "cell" }, "strMobilePhone"),
        (new[] { "phone", "tel" }, "strPhone"),
        (new[] { "title", "job" }, "strJobTitle"),
        (new[] { "department", "dept" }, "strDepartment"),
        (new[] { "lifecycle", "stage" }, "strLifecycleStage"),
        (new[] { "address" }, "strAddress"),
        (new[] { "city" }, "strCity"),
        (new[] { "state" }, "strState"),
        (new[] { "country" }, "strCountry"),
        (new[] { "zip", "postal" }, "strPostalCode"),
        (new[] { "note" }, "strNotes"),
        (new[] { "assignedto", "ownerguid", "assignee" }, "strAssignedToGUID")
    };

    private static readonly List<string> AvailableAccountFields = new()
    {
        "strAccountName",
        "strIndustry",
        "strWebsite",
        "strPhone",
        "strEmail",
        "intEmployeeCount",
        "dblAnnualRevenue",
        "strAddress",
        "strCity",
        "strState",
        "strCountry",
        "strPostalCode",
        "strDescription",
        "strAssignedToGUID"
    };

    private static readonly List<(string[] Keywords, string FieldName)> AccountHeaderMappingRules = new()
    {
        (new[] { "account", "company", "organization", "org" }, "strAccountName"),
        (new[] { "industry" }, "strIndustry"),
        (new[] { "website", "url", "site" }, "strWebsite"),
        (new[] { "phone", "tel" }, "strPhone"),
        (new[] { "email" }, "strEmail"),
        (new[] { "employee", "headcount", "staff" }, "intEmployeeCount"),
        (new[] { "revenue", "annual" }, "dblAnnualRevenue"),
        (new[] { "address" }, "strAddress"),
        (new[] { "city" }, "strCity"),
        (new[] { "state" }, "strState"),
        (new[] { "country" }, "strCountry"),
        (new[] { "zip", "postal" }, "strPostalCode"),
        (new[] { "description", "desc", "about" }, "strDescription"),
        (new[] { "assignedto", "ownerguid", "assignee" }, "strAssignedToGUID")
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

    public async Task<ImportJobListDto> StartContactImportAsync(
        Stream csvStream,
        string fileName,
        ImportStartDto settings,
        Guid tenantId,
        Guid userId)
    {
        var importJob = await CreateImportJobAsync(fileName, settings, tenantId, userId);

        try
        {
            using var reader = new StreamReader(csvStream);
            using var csv = new CsvReader(reader, CreateCsvReadConfiguration());

            await csv.ReadAsync();
            csv.ReadHeader();

            var rows = new List<(int RowNumber, Dictionary<string, string?> FieldValues)>();
            var uniqueEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var candidateAccountGuids = new HashSet<Guid>();
            int rowNumber = 0;

            while (await csv.ReadAsync())
            {
                rowNumber++;
                var fieldValues = ExtractMappedFields(csv, settings.ColumnMapping);
                rows.Add((rowNumber, fieldValues));

                var rawEmail = GetFieldValue(fieldValues, "strEmail");
                if (!string.IsNullOrWhiteSpace(rawEmail))
                {
                    var normalizedEmail = DataNormalizationHelper.NormalizeEmail(rawEmail);
                    if (!string.IsNullOrWhiteSpace(normalizedEmail))
                        uniqueEmails.Add(normalizedEmail);
                }

                var rawAccountGuid = GetFieldValue(fieldValues, "strAccountGUID");
                if (!string.IsNullOrWhiteSpace(rawAccountGuid) && Guid.TryParse(rawAccountGuid, out var parsedAccountGuid))
                    candidateAccountGuids.Add(parsedAccountGuid);
            }

            importJob.intTotalRows = rows.Count;
            importJob.intProcessedRows = rows.Count;

            var existingByEmail = await LoadExistingContactsByEmailAsync(uniqueEmails);
            var validAccountGuids = await LoadExistingAccountGuidsAsync(candidateAccountGuids);
            var pendingContacts = new List<MstContact>(BulkSaveBatchSize);
            var pendingErrors = new List<MstImportJobError>(BulkSaveBatchSize);

            foreach (var (currentRowNumber, fieldValues) in rows)
            {
                try
                {
                    var validationErrors = new List<string>();
                    var firstName = GetFieldValue(fieldValues, "strFirstName");
                    var lastName = GetFieldValue(fieldValues, "strLastName");
                    var rawEmail = GetFieldValue(fieldValues, "strEmail");

                    if (string.IsNullOrWhiteSpace(firstName))
                        validationErrors.Add("First name is required");
                    if (string.IsNullOrWhiteSpace(lastName))
                        validationErrors.Add("Last name is required");
                    if (string.IsNullOrWhiteSpace(rawEmail))
                        validationErrors.Add("Email is required");

                    var normalizedEmail = DataNormalizationHelper.NormalizeEmail(rawEmail ?? string.Empty);
                    if (string.IsNullOrWhiteSpace(normalizedEmail))
                        validationErrors.Add("Email is invalid");

                    Guid? accountGuid = null;
                    var rawAccountGuid = GetFieldValue(fieldValues, "strAccountGUID");
                    if (!string.IsNullOrWhiteSpace(rawAccountGuid))
                    {
                        if (Guid.TryParse(rawAccountGuid, out var parsedAccountGuid))
                        {
                            accountGuid = parsedAccountGuid;
                            if (!validAccountGuids.Contains(parsedAccountGuid))
                                validationErrors.Add($"Account not found for GUID: {parsedAccountGuid}");
                        }
                        else
                        {
                            validationErrors.Add("Account GUID is invalid");
                        }
                    }

                    Guid? assignedToGuid = null;
                    var rawAssignedToGuid = GetFieldValue(fieldValues, "strAssignedToGUID");
                    if (!string.IsNullOrWhiteSpace(rawAssignedToGuid))
                    {
                        if (Guid.TryParse(rawAssignedToGuid, out var parsedAssignedToGuid))
                            assignedToGuid = parsedAssignedToGuid;
                        else
                            validationErrors.Add("Assigned To GUID is invalid");
                    }

                    var lifecycleStage = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strLifecycleStage"))
                        ?? ContactLifecycleStageConstants.Subscriber;
                    var matchedLifecycleStage = ContactLifecycleStageConstants.AllStages
                        .FirstOrDefault(stage => stage.Equals(lifecycleStage, StringComparison.OrdinalIgnoreCase));
                    if (matchedLifecycleStage == null)
                        validationErrors.Add($"Lifecycle stage must be one of: {string.Join(", ", ContactLifecycleStageConstants.AllStages)}");
                    else
                        lifecycleStage = matchedLifecycleStage;

                    if (validationErrors.Count > 0)
                    {
                        pendingErrors.Add(CreateImportError(
                            importJob,
                            currentRowNumber,
                            fieldValues,
                            string.Join("; ", validationErrors),
                            "Validation",
                            tenantId));
                        importJob.intErrorRows++;

                        if (pendingErrors.Count >= BulkSaveBatchSize)
                            await FlushContactImportBatchAsync(pendingContacts, pendingErrors, importJob);
                        continue;
                    }

                    var normalizedPhone = DataNormalizationHelper.NormalizePhone(GetFieldValue(fieldValues, "strPhone"));

                    if (existingByEmail.TryGetValue(normalizedEmail, out var existingContact))
                    {
                        switch (settings.strDuplicateHandling)
                        {
                            case "Skip":
                                importJob.intDuplicateRows++;
                                break;

                            case "Update":
                                UpdateExistingContact(existingContact, fieldValues, normalizedEmail, lifecycleStage, accountGuid, assignedToGuid, userId);
                                importJob.intDuplicateRows++;
                                importJob.intSuccessRows++;
                                break;

                            case "Flag":
                                pendingContacts.Add(CreateContactFromFields(
                                    fieldValues,
                                    normalizedEmail,
                                    normalizedPhone,
                                    lifecycleStage,
                                    accountGuid,
                                    assignedToGuid,
                                    tenantId,
                                    userId));
                                pendingErrors.Add(CreateImportError(
                                    importJob,
                                    currentRowNumber,
                                    fieldValues,
                                    $"Duplicate email found: {normalizedEmail}",
                                    "Duplicate",
                                    tenantId));
                                importJob.intDuplicateRows++;
                                importJob.intSuccessRows++;
                                break;
                        }
                    }
                    else
                    {
                        pendingContacts.Add(CreateContactFromFields(
                            fieldValues,
                            normalizedEmail,
                            normalizedPhone,
                            lifecycleStage,
                            accountGuid,
                            assignedToGuid,
                            tenantId,
                            userId));
                        importJob.intSuccessRows++;
                        existingByEmail[normalizedEmail] = pendingContacts[^1];
                    }

                    if (pendingContacts.Count + pendingErrors.Count >= BulkSaveBatchSize)
                        await FlushContactImportBatchAsync(pendingContacts, pendingErrors, importJob);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing contact row {RowNumber} in import job {JobId}", currentRowNumber, importJob.strImportJobGUID);
                    pendingErrors.Add(CreateImportError(
                        importJob,
                        currentRowNumber,
                        fieldValues,
                        $"System error: {ex.Message}",
                        "System",
                        tenantId));
                    importJob.intErrorRows++;
                    if (pendingErrors.Count >= BulkSaveBatchSize)
                        await FlushContactImportBatchAsync(pendingContacts, pendingErrors, importJob);
                }
            }

            await FlushContactImportBatchAsync(pendingContacts, pendingErrors, importJob);
            await CompleteImportJobAsync(importJob);
            return MapToListDto(importJob);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Contact import job {JobId} failed with exception", importJob.strImportJobGUID);
            await FailImportJobAsync(importJob);
            throw;
        }
    }

    public async Task<ImportSuggestMappingResultDto> SuggestContactMappingAsync(Stream csvStream)
    {
        using var reader = new StreamReader(csvStream);
        using var csv = new CsvReader(reader, CreateCsvReadConfiguration());

        await csv.ReadAsync();
        csv.ReadHeader();
        var headers = csv.HeaderRecord?.ToList() ?? new List<string>();

        var suggestedMapping = new Dictionary<string, string>();
        var usedFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var header in headers)
        {
            var headerLower = header.ToLowerInvariant();

            foreach (var (keywords, fieldName) in ContactHeaderMappingRules)
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
            AvailableLeadFields = AvailableContactFields
        };
    }

    public async Task<ImportJobListDto> StartAccountImportAsync(
        Stream csvStream,
        string fileName,
        ImportStartDto settings,
        Guid tenantId,
        Guid userId)
    {
        var importJob = await CreateImportJobAsync(fileName, settings, tenantId, userId);

        try
        {
            using var reader = new StreamReader(csvStream);
            using var csv = new CsvReader(reader, CreateCsvReadConfiguration());

            await csv.ReadAsync();
            csv.ReadHeader();

            var rows = new List<(int RowNumber, Dictionary<string, string?> FieldValues)>();
            var uniqueNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            int rowNumber = 0;

            while (await csv.ReadAsync())
            {
                rowNumber++;
                var fieldValues = ExtractMappedFields(csv, settings.ColumnMapping);
                rows.Add((rowNumber, fieldValues));

                var rawAccountName = GetFieldValue(fieldValues, "strAccountName");
                if (!string.IsNullOrWhiteSpace(rawAccountName))
                    uniqueNames.Add(rawAccountName.Trim().ToLowerInvariant());
            }

            importJob.intTotalRows = rows.Count;
            importJob.intProcessedRows = rows.Count;

            var existingByName = await LoadExistingAccountsByNormalizedNameAsync(uniqueNames);
            var pendingAccounts = new List<MstAccount>(BulkSaveBatchSize);
            var pendingErrors = new List<MstImportJobError>(BulkSaveBatchSize);

            foreach (var (currentRowNumber, fieldValues) in rows)
            {
                try
                {
                    var validationErrors = new List<string>();
                    var accountName = GetFieldValue(fieldValues, "strAccountName");
                    if (string.IsNullOrWhiteSpace(accountName))
                        validationErrors.Add("Account name is required");

                    Guid? assignedToGuid = null;
                    var rawAssignedToGuid = GetFieldValue(fieldValues, "strAssignedToGUID");
                    if (!string.IsNullOrWhiteSpace(rawAssignedToGuid))
                    {
                        if (Guid.TryParse(rawAssignedToGuid, out var parsedAssignedToGuid))
                            assignedToGuid = parsedAssignedToGuid;
                        else
                            validationErrors.Add("Assigned To GUID is invalid");
                    }

                    int? employeeCount = null;
                    var rawEmployeeCount = GetFieldValue(fieldValues, "intEmployeeCount");
                    if (!string.IsNullOrWhiteSpace(rawEmployeeCount))
                    {
                        if (int.TryParse(rawEmployeeCount, out var parsedEmployeeCount) && parsedEmployeeCount >= 0)
                            employeeCount = parsedEmployeeCount;
                        else
                            validationErrors.Add("Employee count must be a positive integer");
                    }

                    decimal? annualRevenue = null;
                    var rawAnnualRevenue = GetFieldValue(fieldValues, "dblAnnualRevenue");
                    if (!string.IsNullOrWhiteSpace(rawAnnualRevenue))
                    {
                        if (decimal.TryParse(rawAnnualRevenue, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedAnnualRevenue) && parsedAnnualRevenue >= 0)
                            annualRevenue = parsedAnnualRevenue;
                        else
                            validationErrors.Add("Annual revenue must be a positive number");
                    }

                    if (validationErrors.Count > 0)
                    {
                        pendingErrors.Add(CreateImportError(
                            importJob,
                            currentRowNumber,
                            fieldValues,
                            string.Join("; ", validationErrors),
                            "Validation",
                            tenantId));
                        importJob.intErrorRows++;
                        if (pendingErrors.Count >= BulkSaveBatchSize)
                            await FlushAccountImportBatchAsync(pendingAccounts, pendingErrors, importJob);
                        continue;
                    }

                    var normalizedName = accountName!.Trim().ToLowerInvariant();

                    if (existingByName.TryGetValue(normalizedName, out var existingAccount))
                    {
                        switch (settings.strDuplicateHandling)
                        {
                            case "Skip":
                                importJob.intDuplicateRows++;
                                break;

                            case "Update":
                                UpdateExistingAccount(existingAccount, fieldValues, employeeCount, annualRevenue, assignedToGuid, userId);
                                importJob.intDuplicateRows++;
                                importJob.intSuccessRows++;
                                break;

                            case "Flag":
                                pendingAccounts.Add(CreateAccountFromFields(
                                    fieldValues,
                                    employeeCount,
                                    annualRevenue,
                                    assignedToGuid,
                                    tenantId,
                                    userId));
                                pendingErrors.Add(CreateImportError(
                                    importJob,
                                    currentRowNumber,
                                    fieldValues,
                                    $"Duplicate account name found: {accountName}",
                                    "Duplicate",
                                    tenantId));
                                importJob.intDuplicateRows++;
                                importJob.intSuccessRows++;
                                break;
                        }
                    }
                    else
                    {
                        pendingAccounts.Add(CreateAccountFromFields(
                            fieldValues,
                            employeeCount,
                            annualRevenue,
                            assignedToGuid,
                            tenantId,
                            userId));
                        importJob.intSuccessRows++;
                        existingByName[normalizedName] = pendingAccounts[^1];
                    }

                    if (pendingAccounts.Count + pendingErrors.Count >= BulkSaveBatchSize)
                        await FlushAccountImportBatchAsync(pendingAccounts, pendingErrors, importJob);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing account row {RowNumber} in import job {JobId}", currentRowNumber, importJob.strImportJobGUID);
                    pendingErrors.Add(CreateImportError(
                        importJob,
                        currentRowNumber,
                        fieldValues,
                        $"System error: {ex.Message}",
                        "System",
                        tenantId));
                    importJob.intErrorRows++;
                    if (pendingErrors.Count >= BulkSaveBatchSize)
                        await FlushAccountImportBatchAsync(pendingAccounts, pendingErrors, importJob);
                }
            }

            await FlushAccountImportBatchAsync(pendingAccounts, pendingErrors, importJob);
            await CompleteImportJobAsync(importJob);
            return MapToListDto(importJob);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Account import job {JobId} failed with exception", importJob.strImportJobGUID);
            await FailImportJobAsync(importJob);
            throw;
        }
    }

    public async Task<ImportSuggestMappingResultDto> SuggestAccountMappingAsync(Stream csvStream)
    {
        using var reader = new StreamReader(csvStream);
        using var csv = new CsvReader(reader, CreateCsvReadConfiguration());

        await csv.ReadAsync();
        csv.ReadHeader();
        var headers = csv.HeaderRecord?.ToList() ?? new List<string>();

        var suggestedMapping = new Dictionary<string, string>();
        var usedFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var header in headers)
        {
            var headerLower = header.ToLowerInvariant();

            foreach (var (keywords, fieldName) in AccountHeaderMappingRules)
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
            AvailableLeadFields = AvailableAccountFields
        };
    }

    public async Task<byte[]> ExportContactsAsync(ContactFilterParams filter, Guid tenantId)
    {
        var query = _unitOfWork.Contacts.Query()
            .AsNoTracking()
            .Where(c => !c.bolIsDeleted);

        if (filter.strAccountGUID.HasValue)
            query = query.Where(c => c.strAccountGUID == filter.strAccountGUID.Value);

        if (!string.IsNullOrWhiteSpace(filter.strLifecycleStage))
            query = query.Where(c => c.strLifecycleStage == filter.strLifecycleStage);

        if (filter.strAssignedToGUID.HasValue)
            query = query.Where(c => c.strAssignedToGUID == filter.strAssignedToGUID.Value);

        if (filter.bolIsActive.HasValue)
            query = query.Where(c => c.bolIsActive == filter.bolIsActive.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.Trim().ToLower();
            query = query.Where(c =>
                c.strFirstName.ToLower().Contains(searchTerm) ||
                c.strLastName.ToLower().Contains(searchTerm) ||
                c.strEmail.ToLower().Contains(searchTerm) ||
                (c.strPhone != null && c.strPhone.ToLower().Contains(searchTerm)) ||
                (c.strJobTitle != null && c.strJobTitle.ToLower().Contains(searchTerm)) ||
                (c.Account != null && c.Account.strAccountName.ToLower().Contains(searchTerm)));
        }

        var contacts = await query
            .OrderByDescending(c => c.dtCreatedOn)
            .Select(c => new
            {
                c.strFirstName,
                c.strLastName,
                c.strEmail,
                c.strPhone,
                c.strMobilePhone,
                c.strJobTitle,
                c.strDepartment,
                c.strLifecycleStage,
                c.strAccountGUID,
                strAccountName = c.Account != null ? c.Account.strAccountName : null,
                c.strAddress,
                c.strCity,
                c.strState,
                c.strCountry,
                c.strPostalCode,
                c.strNotes,
                c.strAssignedToGUID,
                c.dtCreatedOn,
                c.bolIsActive
            })
            .ToListAsync();

        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));

        var headers = new[]
        {
            "strFirstName", "strLastName", "strEmail", "strPhone", "strMobilePhone",
            "strJobTitle", "strDepartment", "strLifecycleStage", "strAccountGUID",
            "strAccountName", "strAddress", "strCity", "strState", "strCountry",
            "strPostalCode", "strNotes", "strAssignedToGUID", "dtCreatedOn", "bolIsActive"
        };

        foreach (var header in headers)
            csv.WriteField(header);
        await csv.NextRecordAsync();

        foreach (var contact in contacts)
        {
            csv.WriteField(contact.strFirstName);
            csv.WriteField(contact.strLastName);
            csv.WriteField(contact.strEmail);
            csv.WriteField(contact.strPhone);
            csv.WriteField(contact.strMobilePhone);
            csv.WriteField(contact.strJobTitle);
            csv.WriteField(contact.strDepartment);
            csv.WriteField(contact.strLifecycleStage);
            csv.WriteField(contact.strAccountGUID?.ToString());
            csv.WriteField(contact.strAccountName);
            csv.WriteField(contact.strAddress);
            csv.WriteField(contact.strCity);
            csv.WriteField(contact.strState);
            csv.WriteField(contact.strCountry);
            csv.WriteField(contact.strPostalCode);
            csv.WriteField(contact.strNotes);
            csv.WriteField(contact.strAssignedToGUID?.ToString());
            csv.WriteField(contact.dtCreatedOn.ToString("o"));
            csv.WriteField(contact.bolIsActive.ToString());
            await csv.NextRecordAsync();
        }

        await writer.FlushAsync();
        return memoryStream.ToArray();
    }

    public async Task<byte[]> ExportAccountsAsync(AccountFilterParams filter, Guid tenantId)
    {
        var query = _unitOfWork.Accounts.Query()
            .AsNoTracking()
            .Where(a => !a.bolIsDeleted);

        if (!string.IsNullOrWhiteSpace(filter.strIndustry))
            query = query.Where(a => a.strIndustry == filter.strIndustry);

        if (filter.strAssignedToGUID.HasValue)
            query = query.Where(a => a.strAssignedToGUID == filter.strAssignedToGUID.Value);

        if (filter.bolIsActive.HasValue)
            query = query.Where(a => a.bolIsActive == filter.bolIsActive.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.Trim().ToLower();
            query = query.Where(a =>
                a.strAccountName.ToLower().Contains(searchTerm) ||
                (a.strEmail != null && a.strEmail.ToLower().Contains(searchTerm)) ||
                (a.strPhone != null && a.strPhone.ToLower().Contains(searchTerm)) ||
                (a.strIndustry != null && a.strIndustry.ToLower().Contains(searchTerm)));
        }

        var accounts = await query
            .OrderByDescending(a => a.dtCreatedOn)
            .ToListAsync();

        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));

        var headers = new[]
        {
            "strAccountName", "strIndustry", "strWebsite", "strPhone", "strEmail",
            "intEmployeeCount", "dblAnnualRevenue", "strAddress", "strCity", "strState",
            "strCountry", "strPostalCode", "strDescription", "strAssignedToGUID",
            "dtCreatedOn", "bolIsActive"
        };

        foreach (var header in headers)
            csv.WriteField(header);
        await csv.NextRecordAsync();

        foreach (var account in accounts)
        {
            csv.WriteField(account.strAccountName);
            csv.WriteField(account.strIndustry);
            csv.WriteField(account.strWebsite);
            csv.WriteField(account.strPhone);
            csv.WriteField(account.strEmail);
            csv.WriteField(account.intEmployeeCount);
            csv.WriteField(account.dblAnnualRevenue);
            csv.WriteField(account.strAddress);
            csv.WriteField(account.strCity);
            csv.WriteField(account.strState);
            csv.WriteField(account.strCountry);
            csv.WriteField(account.strPostalCode);
            csv.WriteField(account.strDescription);
            csv.WriteField(account.strAssignedToGUID?.ToString());
            csv.WriteField(account.dtCreatedOn.ToString("o"));
            csv.WriteField(account.bolIsActive.ToString());
            await csv.NextRecordAsync();
        }

        await writer.FlushAsync();
        return memoryStream.ToArray();
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

    private async Task<MstImportJob> CreateImportJobAsync(
        string fileName,
        ImportStartDto settings,
        Guid tenantId,
        Guid userId)
    {
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
        return importJob;
    }

    private static CsvConfiguration CreateCsvReadConfiguration()
    {
        return new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            HeaderValidated = null,
            BadDataFound = null
        };
    }

    private static Dictionary<string, string?> ExtractMappedFields(
        CsvReader csv,
        Dictionary<string, string> columnMapping)
    {
        var fieldValues = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

        foreach (var mapping in columnMapping)
        {
            if (string.IsNullOrWhiteSpace(mapping.Value))
                continue;

            string? value = null;
            try
            {
                value = csv.GetField(mapping.Key);
            }
            catch
            {
                // Column not present in this row. Leave null.
            }

            fieldValues[mapping.Value] = value;
        }

        return fieldValues;
    }

    private async Task<Dictionary<string, MstContact>> LoadExistingContactsByEmailAsync(
        IEnumerable<string> normalizedEmails)
    {
        var result = new Dictionary<string, MstContact>(StringComparer.OrdinalIgnoreCase);
        var distinctEmails = normalizedEmails
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .Select(DataNormalizationHelper.NormalizeEmail)
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (distinctEmails.Count == 0)
            return result;

        foreach (var chunk in distinctEmails.Chunk(InClauseBatchSize))
        {
            var chunkList = chunk.ToList();
            var contacts = await _unitOfWork.Contacts.Query()
                .Where(c => chunkList.Contains(c.strEmail))
                .ToListAsync();

            foreach (var contact in contacts)
            {
                var normalizedEmail = DataNormalizationHelper.NormalizeEmail(contact.strEmail);
                if (!result.ContainsKey(normalizedEmail))
                    result[normalizedEmail] = contact;
            }
        }

        return result;
    }

    private async Task<HashSet<Guid>> LoadExistingAccountGuidsAsync(IEnumerable<Guid> accountGuids)
    {
        var requestedGuids = accountGuids.Distinct().ToList();
        var result = new HashSet<Guid>();

        if (requestedGuids.Count == 0)
            return result;

        foreach (var chunk in requestedGuids.Chunk(InClauseBatchSize))
        {
            var chunkList = chunk.ToList();
            var existingGuids = await _unitOfWork.Accounts.Query()
                .Where(a => chunkList.Contains(a.strAccountGUID))
                .Select(a => a.strAccountGUID)
                .ToListAsync();

            foreach (var guid in existingGuids)
                result.Add(guid);
        }

        return result;
    }

    private async Task<Dictionary<string, MstAccount>> LoadExistingAccountsByNormalizedNameAsync(
        IEnumerable<string> normalizedNames)
    {
        var result = new Dictionary<string, MstAccount>(StringComparer.OrdinalIgnoreCase);
        var distinctNames = normalizedNames
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name.Trim().ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (distinctNames.Count == 0)
            return result;

        foreach (var chunk in distinctNames.Chunk(InClauseBatchSize))
        {
            var chunkList = chunk.ToList();
            var accounts = await _unitOfWork.Accounts.Query()
                .Where(a => chunkList.Contains(a.strAccountName.ToLower()))
                .ToListAsync();

            foreach (var account in accounts)
            {
                var normalizedName = account.strAccountName.Trim().ToLowerInvariant();
                if (!result.ContainsKey(normalizedName))
                    result[normalizedName] = account;
            }
        }

        return result;
    }

    private static MstContact CreateContactFromFields(
        Dictionary<string, string?> fieldValues,
        string normalizedEmail,
        string? normalizedPhone,
        string lifecycleStage,
        Guid? accountGuid,
        Guid? assignedToGuid,
        Guid tenantId,
        Guid userId)
    {
        return new MstContact
        {
            strContactGUID = Guid.NewGuid(),
            strGroupGUID = tenantId,
            strAccountGUID = accountGuid,
            strFirstName = GetFieldValue(fieldValues, "strFirstName")?.Trim() ?? string.Empty,
            strLastName = GetFieldValue(fieldValues, "strLastName")?.Trim() ?? string.Empty,
            strEmail = normalizedEmail,
            strPhone = normalizedPhone,
            strMobilePhone = DataNormalizationHelper.NormalizePhone(GetFieldValue(fieldValues, "strMobilePhone")),
            strJobTitle = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strJobTitle")),
            strDepartment = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strDepartment")),
            strLifecycleStage = lifecycleStage,
            strAddress = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strAddress")),
            strCity = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCity")),
            strState = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strState")),
            strCountry = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCountry")),
            strPostalCode = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strPostalCode")),
            strNotes = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strNotes")),
            strAssignedToGUID = assignedToGuid,
            strCreatedByGUID = userId,
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true,
            bolIsDeleted = false
        };
    }

    private static void UpdateExistingContact(
        MstContact contact,
        Dictionary<string, string?> fieldValues,
        string normalizedEmail,
        string lifecycleStage,
        Guid? accountGuid,
        Guid? assignedToGuid,
        Guid userId)
    {
        var firstName = GetFieldValue(fieldValues, "strFirstName");
        if (!string.IsNullOrWhiteSpace(firstName))
            contact.strFirstName = firstName.Trim();

        var lastName = GetFieldValue(fieldValues, "strLastName");
        if (!string.IsNullOrWhiteSpace(lastName))
            contact.strLastName = lastName.Trim();

        contact.strEmail = normalizedEmail;

        var phone = DataNormalizationHelper.NormalizePhone(GetFieldValue(fieldValues, "strPhone"));
        if (!string.IsNullOrWhiteSpace(phone))
            contact.strPhone = phone;

        var mobile = DataNormalizationHelper.NormalizePhone(GetFieldValue(fieldValues, "strMobilePhone"));
        if (!string.IsNullOrWhiteSpace(mobile))
            contact.strMobilePhone = mobile;

        var jobTitle = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strJobTitle"));
        if (!string.IsNullOrWhiteSpace(jobTitle))
            contact.strJobTitle = jobTitle;

        var department = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strDepartment"));
        if (!string.IsNullOrWhiteSpace(department))
            contact.strDepartment = department;

        contact.strLifecycleStage = lifecycleStage;

        if (accountGuid.HasValue)
            contact.strAccountGUID = accountGuid;

        var address = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strAddress"));
        if (!string.IsNullOrWhiteSpace(address))
            contact.strAddress = address;

        var city = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCity"));
        if (!string.IsNullOrWhiteSpace(city))
            contact.strCity = city;

        var state = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strState"));
        if (!string.IsNullOrWhiteSpace(state))
            contact.strState = state;

        var country = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCountry"));
        if (!string.IsNullOrWhiteSpace(country))
            contact.strCountry = country;

        var postalCode = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strPostalCode"));
        if (!string.IsNullOrWhiteSpace(postalCode))
            contact.strPostalCode = postalCode;

        var notes = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strNotes"));
        if (!string.IsNullOrWhiteSpace(notes))
            contact.strNotes = notes;

        if (assignedToGuid.HasValue)
            contact.strAssignedToGUID = assignedToGuid;

        contact.strUpdatedByGUID = userId;
        contact.dtUpdatedOn = DateTime.UtcNow;
    }

    private static MstAccount CreateAccountFromFields(
        Dictionary<string, string?> fieldValues,
        int? employeeCount,
        decimal? annualRevenue,
        Guid? assignedToGuid,
        Guid tenantId,
        Guid userId)
    {
        return new MstAccount
        {
            strAccountGUID = Guid.NewGuid(),
            strGroupGUID = tenantId,
            strAccountName = GetFieldValue(fieldValues, "strAccountName")?.Trim() ?? string.Empty,
            strIndustry = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strIndustry")),
            strWebsite = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strWebsite")),
            strPhone = DataNormalizationHelper.NormalizePhone(GetFieldValue(fieldValues, "strPhone")),
            strEmail = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strEmail")),
            intEmployeeCount = employeeCount,
            dblAnnualRevenue = annualRevenue,
            strAddress = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strAddress")),
            strCity = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCity")),
            strState = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strState")),
            strCountry = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCountry")),
            strPostalCode = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strPostalCode")),
            strDescription = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strDescription")),
            strAssignedToGUID = assignedToGuid,
            strCreatedByGUID = userId,
            dtCreatedOn = DateTime.UtcNow,
            bolIsActive = true,
            bolIsDeleted = false
        };
    }

    private static void UpdateExistingAccount(
        MstAccount account,
        Dictionary<string, string?> fieldValues,
        int? employeeCount,
        decimal? annualRevenue,
        Guid? assignedToGuid,
        Guid userId)
    {
        var accountName = GetFieldValue(fieldValues, "strAccountName");
        if (!string.IsNullOrWhiteSpace(accountName))
            account.strAccountName = accountName.Trim();

        var industry = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strIndustry"));
        if (!string.IsNullOrWhiteSpace(industry))
            account.strIndustry = industry;

        var website = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strWebsite"));
        if (!string.IsNullOrWhiteSpace(website))
            account.strWebsite = website;

        var phone = DataNormalizationHelper.NormalizePhone(GetFieldValue(fieldValues, "strPhone"));
        if (!string.IsNullOrWhiteSpace(phone))
            account.strPhone = phone;

        var email = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strEmail"));
        if (!string.IsNullOrWhiteSpace(email))
            account.strEmail = DataNormalizationHelper.NormalizeEmail(email);

        if (employeeCount.HasValue)
            account.intEmployeeCount = employeeCount;

        if (annualRevenue.HasValue)
            account.dblAnnualRevenue = annualRevenue;

        var address = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strAddress"));
        if (!string.IsNullOrWhiteSpace(address))
            account.strAddress = address;

        var city = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCity"));
        if (!string.IsNullOrWhiteSpace(city))
            account.strCity = city;

        var state = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strState"));
        if (!string.IsNullOrWhiteSpace(state))
            account.strState = state;

        var country = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strCountry"));
        if (!string.IsNullOrWhiteSpace(country))
            account.strCountry = country;

        var postalCode = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strPostalCode"));
        if (!string.IsNullOrWhiteSpace(postalCode))
            account.strPostalCode = postalCode;

        var description = DataNormalizationHelper.TrimOrNull(GetFieldValue(fieldValues, "strDescription"));
        if (!string.IsNullOrWhiteSpace(description))
            account.strDescription = description;

        if (assignedToGuid.HasValue)
            account.strAssignedToGUID = assignedToGuid;

        account.strUpdatedByGUID = userId;
        account.dtUpdatedOn = DateTime.UtcNow;
    }

    private static MstImportJobError CreateImportError(
        MstImportJob importJob,
        int rowNumber,
        Dictionary<string, string?>? fieldValues,
        string errorMessage,
        string errorType,
        Guid tenantId)
    {
        return new MstImportJobError
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
    }

    private async Task FlushContactImportBatchAsync(
        List<MstContact> pendingContacts,
        List<MstImportJobError> pendingErrors,
        MstImportJob importJob)
    {
        if (pendingContacts.Count == 0 && pendingErrors.Count == 0)
            return;

        if (pendingContacts.Count > 0)
            await _unitOfWork.Contacts.AddRangeAsync(pendingContacts);

        if (pendingErrors.Count > 0)
        {
            foreach (var error in pendingErrors)
                await _unitOfWork.ImportJobErrors.AddAsync(error);
        }

        _unitOfWork.ImportJobs.Update(importJob);
        await _unitOfWork.SaveChangesAsync();

        pendingContacts.Clear();
        pendingErrors.Clear();
    }

    private async Task FlushAccountImportBatchAsync(
        List<MstAccount> pendingAccounts,
        List<MstImportJobError> pendingErrors,
        MstImportJob importJob)
    {
        if (pendingAccounts.Count == 0 && pendingErrors.Count == 0)
            return;

        if (pendingAccounts.Count > 0)
            await _unitOfWork.Accounts.AddRangeAsync(pendingAccounts);

        if (pendingErrors.Count > 0)
        {
            foreach (var error in pendingErrors)
                await _unitOfWork.ImportJobErrors.AddAsync(error);
        }

        _unitOfWork.ImportJobs.Update(importJob);
        await _unitOfWork.SaveChangesAsync();

        pendingAccounts.Clear();
        pendingErrors.Clear();
    }

    private async Task CompleteImportJobAsync(MstImportJob importJob)
    {
        importJob.strStatus = ImportStatusConstants.Completed;
        importJob.dtCompletedOn = DateTime.UtcNow;
        _unitOfWork.ImportJobs.Update(importJob);
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task FailImportJobAsync(MstImportJob importJob)
    {
        importJob.strStatus = ImportStatusConstants.Failed;
        importJob.dtCompletedOn = DateTime.UtcNow;
        _unitOfWork.ImportJobs.Update(importJob);
        await _unitOfWork.SaveChangesAsync();
    }

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
