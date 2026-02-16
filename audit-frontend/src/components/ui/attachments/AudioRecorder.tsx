import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Square,
  X,
  Save,
  Volume2,
  FileAudio,
  Clock,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface AudioRecorderProps {
  onAudioSaved: (file: File) => void;
  onCancel: () => void;
  open: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioSaved,
  onCancel,
  open,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [fileSize, setFileSize] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sizeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sizeCheckIntervalRef.current) {
        clearInterval(sizeCheckIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const resetRecording = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setFilename("");
    setFileSize(0);
    chunksRef.current = [];

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (sizeCheckIntervalRef.current) {
      clearInterval(sizeCheckIntervalRef.current);
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  useEffect(() => {
    if (open) {
      // Reset only when dialog opens, not when dependencies change
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      setAudioBlob(null);
      setFilename("");
      setFileSize(0);
      chunksRef.current = [];

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sizeCheckIntervalRef.current) {
        clearInterval(sizeCheckIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);

          // Check file size during recording
          const currentSize = chunksRef.current.reduce(
            (total, chunk) => total + chunk.size,
            0
          );
          if (currentSize >= MAX_FILE_SIZE) {
            mediaRecorder.stop();
            toast.error("Recording stopped: Maximum file size (10MB) reached");
          }
        }
      };

      mediaRecorder.onstop = () => {
        // Set recording state to false first
        setIsRecording(false);
        setIsPaused(false);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setFileSize(blob.size);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Generate default filename
        const now = new Date();
        const defaultName = `Audio_Recording_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
        setFilename(defaultName);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        // Clear size check interval
        if (sizeCheckIntervalRef.current) {
          clearInterval(sizeCheckIntervalRef.current);
        }
      };

      mediaRecorder.start(1000); // Collect data every second for size checking
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      toast.info("Recording paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      toast.info("Recording resumed");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // The onstop event will handle the rest
    }
  };

  const handleSaveRecording = () => {
    if (!audioBlob || !filename.trim()) {
      toast.error("Please provide a filename");
      return;
    }

    const file = new File([audioBlob], `${filename.trim()}.webm`, {
      type: "audio/webm",
    });

    onAudioSaved(file);
    resetRecording();
    toast.success("Audio recording saved successfully");
  };

  const handleCancel = () => {
    if (isRecording) {
      // Stop the recording first
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setIsPaused(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    // Reset everything
    resetRecording();

    // Notify parent to close the modal
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={() => handleCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
            <FileAudio className="h-5 w-5 text-primary" />
            <span>Audio Recording</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-3 rounded-full ${
                      isRecording
                        ? "bg-destructive/10 text-destructive"
                        : audioBlob
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isRecording ? (
                      <Mic
                        className={`h-5 w-5 ${isPaused ? "text-yellow-500" : ""}`}
                      />
                    ) : audioBlob ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <FileAudio className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {isRecording
                        ? isPaused
                          ? "Recording Paused"
                          : "Recording..."
                        : audioBlob
                          ? "Recording Complete"
                          : "Ready to Record"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {audioBlob
                        ? "You can now preview and save your recording"
                        : "Click the microphone to start"}
                    </div>{" "}
                    {fileSize > 0 && (
                      <div className="text-xs text-primary font-medium">
                        File size: {formatFileSize(fileSize)}
                      </div>
                    )}{" "}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-mono font-bold text-primary">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recording Wave Animation */}
              {isRecording && !isPaused && (
                <div className="mt-4 flex items-center justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 bg-primary rounded-full animate-pulse`}
                      style={{
                        height: `${Math.random() * 20 + 10}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "0.5s",
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recording Controls */}
          <div className="flex justify-center">
            {!isRecording && !audioBlob ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="h-20 w-20 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Mic className="h-8 w-8" />
              </Button>
            ) : isRecording ? (
              <div className="flex space-x-4">
                {!isPaused ? (
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    size="lg"
                    className="h-14 w-14 rounded-full border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-950/20"
                  >
                    <Pause className="h-6 w-6" />
                  </Button>
                ) : (
                  <Button
                    onClick={resumeRecording}
                    variant="outline"
                    size="lg"
                    className="h-14 w-14 rounded-full border-2 border-primary text-primary hover:bg-primary/10"
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                )}

                <Button
                  onClick={stopRecording}
                  size="lg"
                  className="h-14 w-14 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border-2 border-primary shadow-lg"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </div>
            ) : null}
          </div>

          {/* Filename Input */}
          {audioBlob && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-medium text-foreground">
                  Save Recording
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="filename"
                    className="text-sm text-muted-foreground"
                  >
                    Filename
                  </Label>
                  <Input
                    id="filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="Enter filename"
                    className="bg-background"
                  />
                  <div className="text-xs text-muted-foreground">
                    File will be saved as:{" "}
                    <span className="font-medium text-primary">
                      {filename.trim() || "filename"}.webm
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audio Preview */}
          {audioBlob && (
            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-foreground mb-3">
                  Preview Recording
                </div>
                <audio
                  controls
                  controlsList="nodownload noremoteplayback"
                  className="w-full rounded-md"
                  src={audioUrl || undefined}
                  preload="metadata"
                >
                  Your browser does not support the audio element.
                </audio>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-between pt-6">
          <Button variant="outline" onClick={handleCancel} className="px-6">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          {audioBlob && (
            <Button
              onClick={handleSaveRecording}
              className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Recording
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
