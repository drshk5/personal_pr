-- =============================================
-- Seed Default Pipeline — Run once per tenant
-- Replace <<TENANT_GROUP_GUID>> with actual tenant GUID
-- =============================================

DECLARE @PipelineGUID UNIQUEIDENTIFIER = NEWID();
DECLARE @GroupGUID UNIQUEIDENTIFIER = '<<TENANT_GROUP_GUID>>';

INSERT INTO MstPipelines (strPipelineGUID, strGroupGUID, strPipelineName, strDescription, bolIsDefault, strCreatedByGUID, dtCreatedOn, bolIsActive, bolIsDeleted)
VALUES (@PipelineGUID, @GroupGUID, 'Sales Pipeline', 'Default sales pipeline', 1, @GroupGUID, GETUTCDATE(), 1, 0);

INSERT INTO MstPipelineStages (strStageGUID, strPipelineGUID, strStageName, intDisplayOrder, intProbabilityPercent, intDefaultDaysToRot, bolIsWonStage, bolIsLostStage, dtCreatedOn, bolIsActive)
VALUES
  (NEWID(), @PipelineGUID, 'Prospecting',    1, 10, 14, 0, 0, GETUTCDATE(), 1),
  (NEWID(), @PipelineGUID, 'Qualification',  2, 25, 21, 0, 0, GETUTCDATE(), 1),
  (NEWID(), @PipelineGUID, 'Proposal',       3, 50, 30, 0, 0, GETUTCDATE(), 1),
  (NEWID(), @PipelineGUID, 'Negotiation',    4, 75, 14, 0, 0, GETUTCDATE(), 1),
  (NEWID(), @PipelineGUID, 'Closed Won',     5, 100, 0, 1, 0, GETUTCDATE(), 1),
  (NEWID(), @PipelineGUID, 'Closed Lost',    6, 0,   0, 0, 1, GETUTCDATE(), 1);

PRINT 'Default pipeline seeded successfully';
