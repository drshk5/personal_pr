import React from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileType,
  Archive,
  AudioLines,
  Video,
  FileImage,
} from "lucide-react";
import { getFileIconInfo } from "@/lib/utils/file-utils";

export type FileIconProps = {
  fileType?: string;
  size?: number;
  className?: string;
};

export const FileIcon: React.FC<FileIconProps> = ({
  fileType,
  size = 24,
  className,
}) => {
  const iconInfo = getFileIconInfo(fileType);
  const combinedClassName = className
    ? `${iconInfo.color} ${className}`
    : iconInfo.color;

  switch (iconInfo.type) {
    case "spreadsheet":
      return <FileSpreadsheet size={size} className={combinedClassName} />;
    case "document":
      return <FileText size={size} className={combinedClassName} />;
    case "presentation":
      return <FileType size={size} className={combinedClassName} />;
    case "pdf":
      return <FileText size={size} className={combinedClassName} />;
    case "code":
      return <FileCode size={size} className={combinedClassName} />;
    case "archive":
      return <Archive size={size} className={combinedClassName} />;
    case "audio":
      return <AudioLines size={size} className={combinedClassName} />;
    case "video":
      return <Video size={size} className={combinedClassName} />;
    case "image":
      return <FileImage size={size} className={combinedClassName} />;
    default:
      return <FileText size={size} className={combinedClassName} />;
  }
};

export const LargeFileIcon: React.FC<FileIconProps> = (props) => {
  return <FileIcon {...props} size={props.size || 64} />;
};
