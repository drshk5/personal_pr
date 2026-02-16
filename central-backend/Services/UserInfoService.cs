using System;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AuditSoftware.Data;
using AuditSoftware.DTOs.UserInfo;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Exceptions;

namespace AuditSoftware.Services
{
    public class UserInfoService : IUserInfoService
    {
        private class NotFoundException : Exception 
        {
            public NotFoundException(string message) : base(message) {}
        }
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<UserInfoService> _logger;

        public UserInfoService(AppDbContext context, IMapper mapper, ILogger<UserInfoService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<UserInfoResponseDto> CreateAsync(UserInfoCreateDto createDto, Guid currentUserGuid)
        {
            try
            {
                // Check if user exists
                var user = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.strUserGUID == createDto.strUserGUID);

                if (user == null)
                {
                    throw new NotFoundException($"User with ID {createDto.strUserGUID} not found");
                }

                // Check if user info already exists for this user
                var existingInfo = await _context.MstUserInfos
                    .FirstOrDefaultAsync(ui => ui.strUserGUID == createDto.strUserGUID);

                if (existingInfo != null)
                {
                    throw new BusinessException($"User info already exists for user with ID {createDto.strUserGUID}");
                }

                var userInfo = _mapper.Map<MstUserInfo>(createDto);
                userInfo.strCreatedByGUID = currentUserGuid;
                userInfo.dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();

                _context.MstUserInfos.Add(userInfo);
                await _context.SaveChangesAsync();

                // Also update the user's last module GUID if provided
                if (createDto.strModuleGUID != Guid.Empty && user != null)
                {
                    user.strLastModuleGUID = createDto.strModuleGUID;
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation($"Created user info for user {createDto.strUserGUID}");
                
                return _mapper.Map<UserInfoResponseDto>(userInfo);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, $"Error creating user info: {ex.Message}");
                throw new BusinessException($"An error occurred while creating the user info: {ex.Message}");
            }
        }

        public async Task<UserInfoResponseDto?> GetByUserIdAsync(Guid userGuid)
        {
            var userInfo = await _context.MstUserInfos
                .FirstOrDefaultAsync(ui => ui.strUserGUID == userGuid);

            return userInfo != null ? _mapper.Map<UserInfoResponseDto>(userInfo) : null;
        }

        public async Task<UserInfoResponseDto?> GetByUserAndModuleAsync(Guid userGuid, Guid moduleGuid)
        {
            var userInfo = await _context.MstUserInfos
                .FirstOrDefaultAsync(ui => ui.strUserGUID == userGuid && ui.strModuleGUID == moduleGuid);

            return userInfo != null ? _mapper.Map<UserInfoResponseDto>(userInfo) : null;
        }

        public async Task<UserInfoResponseDto> UpdateAsync(Guid userInfoGuid, UserInfoUpdateDto updateDto, Guid currentUserGuid)
        {
            var userInfo = await _context.MstUserInfos
                .FirstOrDefaultAsync(ui => ui.strUserInfoGUID == userInfoGuid);

            if (userInfo == null)
            {
                throw new NotFoundException($"User info with ID {userInfoGuid} not found");
            }

            _mapper.Map(updateDto, userInfo);
            userInfo.strUpdatedByGUID = currentUserGuid;
            userInfo.dtUpdatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();

            // Also update the user's last module GUID if provided
            if (updateDto.strModuleGUID != Guid.Empty)
            {
                var user = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.strUserGUID == userInfo.strUserGUID);

                if (user != null)
                {
                    user.strLastModuleGUID = updateDto.strModuleGUID;
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"Updated user info {userInfoGuid}");

            return _mapper.Map<UserInfoResponseDto>(userInfo);
        }

        public async Task<bool> DeleteAsync(Guid userInfoGuid)
        {
            var userInfo = await _context.MstUserInfos
                .FirstOrDefaultAsync(ui => ui.strUserInfoGUID == userInfoGuid);

            if (userInfo == null)
            {
                return false;
            }

            _context.MstUserInfos.Remove(userInfo);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Deleted user info {userInfoGuid}");

            return true;
        }
    }
}
