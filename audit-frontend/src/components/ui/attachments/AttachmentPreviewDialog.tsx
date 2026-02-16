import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  MoreVertical,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileIcon, LargeFileIcon } from "@/components/ui/file-icons";
import { LazyImage } from "@/components/ui/lazy-image";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";

export interface PreviewFile {
  url: string;
  name: string;
  type: string;
  isImage: boolean;
  isPdf?: boolean;
  isAudio?: boolean;
  size?: string;
}

interface AttachmentPreviewDialogProps {
  files: PreviewFile[];
  currentIndex: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export const AttachmentPreviewDialog: React.FC<
  AttachmentPreviewDialogProps
> = ({ files, currentIndex, onClose, onIndexChange }) => {
  const [imageError, setImageError] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const currentFile = currentIndex !== null ? files[currentIndex] : null;

  // Reset audio state when file changes
  useEffect(() => {
    setAudioError(false);
    // Force audio element to reload when file changes
    const audioElements = document.querySelectorAll("audio");
    audioElements.forEach((audio) => {
      audio.load(); // Reload the audio element
    });
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex !== null && currentIndex < files.length - 1) {
      onIndexChange(currentIndex + 1);
      setImageError(false);
      setPdfError(false);
      setAudioError(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex !== null && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
      setImageError(false);
      setPdfError(false);
      setAudioError(false);
    }
  };

  const handleClose = () => {
    setImageError(false);
    setPdfError(false);
    setAudioError(false);
    onClose();
  };

  const handleDownload = () => {
    if (currentFile?.url && currentFile?.name) {
      const link = document.createElement("a");
      link.href = currentFile.url;
      link.download = currentFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (currentFile?.url) {
      window.open(currentFile.url, "_blank");
    }
  };

  return (
    <Dialog open={currentIndex !== null} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0 overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">
          {currentFile?.name || "File Preview"}
        </DialogTitle>

        <div className="relative w-full h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="shrink-0 bg-muted/50 dark:bg-muted/30 backdrop-blur-sm border-b border-border/50 p-4 flex items-center justify-between shadow-sm">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span
                className="text-sm text-foreground font-medium truncate max-w-75"
                title={currentFile?.name}
              >
                {currentFile?.name}
              </span>
              {currentFile?.size && (
                <span className="text-xs text-muted-foreground">
                  {currentFile.size}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={handleOpenInNewTab}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in new tab
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Preview Area */}
          <div className="flex items-center justify-center flex-1 w-full overflow-auto bg-background overscroll-contain min-h-0">
            {currentFile?.isImage && !imageError ? (
              <div className="w-full h-full p-4 flex items-center justify-center">
                <ImageZoom className="w-full h-full flex items-center justify-center min-h-0 min-w-0">
                  <LazyImage
                    src={currentFile.url}
                    alt={currentFile.name}
                    className="max-w-full max-h-full object-contain"
                    containerClassName="w-full h-full flex items-center justify-center min-h-0 min-w-0"
                    loading="eager"
                    onError={() => setImageError(true)}
                  />
                </ImageZoom>
              </div>
            ) : currentFile?.isPdf && !pdfError ? (
              <iframe
                src={`${currentFile.url}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0 bg-white"
                title={currentFile.name}
                style={{ minHeight: "100%" }}
                onError={() => setPdfError(true)}
              />
            ) : currentFile?.isAudio && !audioError ? (
              <div className="flex flex-col items-center gap-6 p-8">
                <LargeFileIcon fileType={currentFile.type} size={128} />
                <div className="text-center">
                  <p className="text-lg text-foreground font-medium mb-2">
                    {currentFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {currentFile.size && `File size: ${currentFile.size}`}
                  </p>
                </div>
                <div className="w-full max-w-md">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <div className="text-center mb-4">
                      <h3 className="font-medium text-foreground">
                        Audio Preview
                      </h3>
                    </div>
                    <audio
                      key={currentFile.url} // Force re-creation when URL changes
                      controls
                      controlsList="nodownload noremoteplayback"
                      className="w-full rounded-md"
                      preload="auto"
                      onError={() => setAudioError(true)}
                      onLoadedMetadata={(e) => {
                        // Ensure the audio duration is properly loaded
                        const audio = e.target as HTMLAudioElement;
                        if (audio.duration && !isNaN(audio.duration)) {
                          audio.currentTime = 0;
                        }
                      }}
                    >
                      <source src={currentFile.url} type={currentFile.type} />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-4">
                <LargeFileIcon fileType={currentFile?.type} size={96} />
                <div className="text-center">
                  <p className="text-lg text-muted-foreground font-medium">
                    {imageError || pdfError || audioError
                      ? "Failed to load file"
                      : "Preview not available"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentFile?.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls - Only show if multiple files */}
          {files.length > 1 && (
            <>
              <div className="absolute border border-border-color left-4 text-foreground bottom-4 backdrop-blur-sm px-3 py-1.5 rounded-md z-10">
                <span className="text-sm font-medium">
                  {currentIndex !== null &&
                    `${currentIndex + 1} of ${files.length}`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                onClick={handleNext}
                disabled={currentIndex === files.length - 1}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Thumbnail Strip */}
          {files.length > 1 && (
            <div className="shrink-0 bg-muted/50 dark:bg-muted/30 backdrop-blur-sm border-t border-border-color p-2">
              <div className="flex gap-2 overflow-x-auto overscroll-contain justify-center pb-1">
                {files.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onIndexChange(idx);
                      setImageError(false);
                      setPdfError(false);
                      setAudioError(false);
                    }}
                    className={`shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                      idx === currentIndex
                        ? "border-primary ring-2 ring-primary/50 shadow-lg scale-90"
                        : "border-border-color hover:border-muted-foreground/50"
                    }`}
                  >
                    {file.isImage ? (
                      <LazyImage
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                        placeholderClassName="w-full h-full"
                        loading="lazy"
                        threshold={0.1}
                        rootMargin="20px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <FileIcon fileType={file.type} size={24} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
