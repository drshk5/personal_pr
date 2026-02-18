import { useState } from "react";
import { Bell, FileText, Calendar, Search, FolderOpen, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationCenter } from "./NotificationCenter";
import { NotesPanel } from "./NotesPanel";
import { MeetingScheduler } from "./MeetingScheduler";
import { CommandPalette } from "./CommandPalette";
import { cn } from "@/lib/utils";

interface EnhancementToolbarProps {
  entityType?: string;
  entityId?: string;
  entityName?: string;
}

export function EnhancementToolbar({
  entityType,
  entityId,
  entityName,
}: EnhancementToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<
    "notifications" | "notes" | "meetings" | "documents" | null
  >(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const togglePanel = (panel: typeof activePanel) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };

  const tools = [
    {
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => togglePanel("notifications"),
    },
    {
      id: "notes",
      icon: FileText,
      label: "Notes",
      color: "bg-yellow-500 hover:bg-yellow-600",
      onClick: () => togglePanel("notes"),
    },
    {
      id: "meetings",
      icon: Calendar,
      label: "Meetings",
      color: "bg-green-500 hover:bg-green-600",
      onClick: () => togglePanel("meetings"),
    },
    {
      id: "search",
      icon: Search,
      label: "Quick Search",
      color: "bg-purple-500 hover:bg-purple-600",
      onClick: () => setShowCommandPalette(true),
    },
    {
      id: "documents",
      icon: FolderOpen,
      label: "Documents",
      color: "bg-orange-500 hover:bg-orange-600",
      onClick: () => togglePanel("documents"),
    },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tool Buttons */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-full shadow-lg text-white h-12 w-12 p-0 relative group",
                      tool.color,
                      activePanel === tool.id && "ring-4 ring-white ring-opacity-50"
                    )}
                    onClick={tool.onClick}
                    title={tool.label}
                  >
                    <tool.icon className="h-5 w-5" />
                    <span className="absolute right-full mr-3 bg-popover text-popover-foreground border shadow-md px-3 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {tool.label}
                    </span>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Toggle Button */}
        <Button
          size="lg"
          className={cn(
            "rounded-full shadow-2xl h-14 w-14 p-0 transition-all",
            isOpen
              ? "bg-red-500 hover:bg-red-600 rotate-45"
              : "bg-primary hover:bg-primary/90"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Side Panels */}
      <AnimatePresence>
        {activePanel === "notifications" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-96 bg-background border-l shadow-2xl z-40 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-73px)]">
              <NotificationCenter />
            </div>
          </motion.div>
        )}

        {activePanel === "notes" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-96 bg-background border-l shadow-2xl z-40 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-foreground">Notes</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-73px)]">
              <NotesPanel
                entityType={entityType || "Lead"}
                entityId={entityId || ""}
              />
            </div>
          </motion.div>
        )}

        {/* MeetingScheduler is a dialog, rendered separately */}
        <MeetingScheduler
          open={activePanel === "meetings"}
          onOpenChange={(open) => setActivePanel(open ? "meetings" : null)}
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
        />

        {activePanel === "documents" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[600px] bg-background border-l shadow-2xl z-40 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Documents</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-73px)] p-4">
              <div className="text-center text-muted-foreground py-8">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-foreground">Document Manager</p>
                <p className="text-sm mt-2">
                  Upload and manage documents related to {entityType || "CRM entities"}
                </p>
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
      />
    </>
  );
}
