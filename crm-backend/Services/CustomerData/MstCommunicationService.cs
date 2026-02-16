using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Services.CustomerData;

public class MstCommunicationService : ServiceBase, ICommunicationService
{
    private readonly IUnitOfWork _unitOfWork;

    public MstCommunicationService(IUnitOfWork unitOfWork, ITenantContextProvider tenantContextProvider, ILogger<MstCommunicationService> logger)
        : base(tenantContextProvider, logger) { _unitOfWork = unitOfWork; }

    public async Task TrackEmailOpenAsync(Guid trackingPixelGuid)
    {
        var comm = await _unitOfWork.LeadCommunications.GetByTrackingPixelAsync(trackingPixelGuid);
        if (comm != null && !comm.bolIsOpened)
        {
            comm.bolIsOpened = true;
            comm.dtOpenedOn = DateTime.UtcNow;
            _unitOfWork.LeadCommunications.Update(comm);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task IncrementClickCountAsync(Guid communicationGuid)
    {
        var comm = await _unitOfWork.LeadCommunications.GetByIdAsync(communicationGuid);
        if (comm != null)
        {
            comm.intClickCount++;
            _unitOfWork.LeadCommunications.Update(comm);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
