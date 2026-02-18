import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TimelineView } from '@/components/CRM/TimelineView';
import { NotesPanel } from '@/components/CRM/NotesPanel';
import { MeetingScheduler } from '@/components/CRM/MeetingScheduler';
import {
  FileText,
  Calendar,
  MessageSquare,
  Clock,
  Mail,
  Phone,
  Video,
} from 'lucide-react';

interface EnhancedEntityViewProps {
  entityType: 'Lead' | 'Contact' | 'Account' | 'Opportunity';
  entityId: string;
  entityName: string;
}

/**
 * Enhanced Entity View - Integrates all new CRM enhancement features
 * Use this as a reference for integrating the new components into your existing detail pages
 */
export const EnhancedEntityView: React.FC<EnhancedEntityViewProps> = ({
  entityType,
  entityId,
  entityName,
}) => {
  const [activeTab, setActiveTab] = useState('timeline');
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{entityName}</h1>
          <p className="text-muted-foreground">
            {entityType} Details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="w-4 h-4 mr-2" />
            Log Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMeetingScheduler(true)}
          >
            <Video className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Entity Information Card */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {entityType} Information
            </h2>
            {/* Your existing entity form/display here */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className="ml-2">Active</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Score</label>
                  <Badge variant="secondary" className="ml-2">85</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Activity Section */}
          <div className="bg-card border rounded-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-6">
                <TabsList className="h-12">
                  <TabsTrigger value="timeline" className="gap-2">
                    <Clock className="w-4 h-4" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="meetings" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Meetings
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Documents
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="timeline" className="mt-0">
                  <TimelineView
                    entityType={entityType}
                    entityId={entityId}
                    className="h-[600px]"
                  />
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <NotesPanel
                    entityType={entityType}
                    entityId={entityId}
                    className="h-[600px]"
                  />
                </TabsContent>

                <TabsContent value="meetings" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Upcoming Meetings</h3>
                      <Button
                        size="sm"
                        onClick={() => setShowMeetingScheduler(true)}
                      >
                        Schedule New
                      </Button>
                    </div>
                    {/* Meeting list would go here */}
                    <p className="text-sm text-muted-foreground">
                      No upcoming meetings scheduled
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Documents</h3>
                      <Button size="sm">Upload Document</Button>
                    </div>
                    {/* Document list would go here */}
                    <p className="text-sm text-muted-foreground">
                      No documents uploaded
                    </p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Activities</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Notes</span>
                <Badge variant="secondary">5</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Meetings</span>
                <Badge variant="secondary">2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Documents</span>
                <Badge variant="secondary">3</Badge>
              </div>
            </div>
          </div>

          {/* Related Information */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Related</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Related contacts, accounts, and opportunities would appear here
              </p>
            </div>
          </div>

          {/* Tags or Custom Fields */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">High Priority</Badge>
              <Badge variant="outline">Enterprise</Badge>
              <Badge variant="outline">Q1 Target</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Scheduler Dialog */}
      <MeetingScheduler
        open={showMeetingScheduler}
        onOpenChange={setShowMeetingScheduler}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
        onSave={(meeting) => {
          console.log('Meeting scheduled:', meeting);
          // Handle meeting save - refresh meetings list, show notification, etc.
        }}
      />
    </div>
  );
};

// Export example usage
export default EnhancedEntityView;

/**
 * USAGE EXAMPLE:
 * 
 * Import this component into your Lead/Contact/Account/Opportunity detail pages:
 * 
 * import { EnhancedEntityView } from '@/components/CRM/EnhancedEntityView';
 * 
 * function LeadDetail() {
 *   const { id } = useParams();
 *   const { data: lead } = useGetLead(id);
 *   
 *   return (
 *     <EnhancedEntityView
 *       entityType="Lead"
 *       entityId={id}
 *       entityName={lead?.name || 'Loading...'}
 *     />
 *   );
 * }
 */
