using Microsoft.AspNetCore.Mvc;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

/// <summary>
/// Internal notes with @mention support for team collaboration
/// </summary>
[Route("api/crm/notes")]
[RequireTenantId]
public class NotesController : BaseController
{
    private readonly ILogger<NotesController> _logger;

    public NotesController(ILogger<NotesController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get notes for a specific entity
    /// </summary>
    [HttpGet]
    [AuthorizePermission("CRM_Notes", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<NoteListDto>>>> GetNotes(
        [FromQuery] NoteFilterParams filter)
    {
        // TODO: Implement
        var result = new PagedResponse<NoteListDto>
        {
            Items = new List<NoteListDto>(),
            TotalCount = 0,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = 0
        };
        return OkResponse(result);
    }

    /// <summary>
    /// Get single note by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [AuthorizePermission("CRM_Notes", "View")]
    public async Task<ActionResult<ApiResponse<NoteListDto>>> GetNote(Guid id)
    {
        // TODO: Implement
        return ErrorResponse<NoteListDto>(404, "Note not found", "NOTE_NOT_FOUND");
    }

    /// <summary>
    /// Create a new note
    /// </summary>
    [HttpPost]
    [AuthorizePermission("CRM_Notes", "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<NoteListDto>>> CreateNote([FromBody] CreateNoteDto dto)
    {
        // TODO: Implement - Also trigger notifications for @mentions
        return CreatedResponse<NoteListDto>(null!);
    }

    /// <summary>
    /// Update an existing note
    /// </summary>
    [HttpPut("{id:guid}")]
    [AuthorizePermission("CRM_Notes", "Edit")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<NoteListDto>>> UpdateNote(Guid id, [FromBody] UpdateNoteDto dto)
    {
        // TODO: Implement
        return OkResponse<NoteListDto>(null!);
    }

    /// <summary>
    /// Delete a note
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AuthorizePermission("CRM_Notes", "Delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteNote(Guid id)
    {
        // TODO: Implement
        return OkResponse(true, "Note deleted successfully");
    }

    /// <summary>
    /// Pin/unpin a note
    /// </summary>
    [HttpPost("{id:guid}/toggle-pin")]
    [AuthorizePermission("CRM_Notes", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> TogglePin(Guid id)
    {
        // TODO: Implement
        return OkResponse(true, "Note pin status toggled");
    }
}
