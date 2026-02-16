export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatFileSize = (size: string | undefined) => {
  if (!size) return "-";

  if (!isNaN(Number(size))) {
    const bytes = Number(size);
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  return size;
};

export const getFileIconInfo = (fileType?: string) => {
  if (!fileType) {
    return {
      type: "default",
      color: "text-primary dark:text-sidebar-primary",
    };
  }

  const type = fileType.toLowerCase();

  if (
    type.includes("excel") ||
    type.includes("spreadsheet") ||
    type.includes("csv") ||
    type.includes("xls")
  ) {
    return {
      type: "spreadsheet",
      color: "text-green-600 dark:text-green-400",
    };
  }

  if (
    type.includes("word") ||
    type.includes("doc") ||
    type.includes("text/plain") ||
    type.includes("rtf")
  ) {
    return {
      type: "document",
      color: "text-blue-600 dark:text-blue-400",
    };
  }

  if (
    type.includes("powerpoint") ||
    type.includes("presentation") ||
    type.includes("ppt")
  ) {
    return {
      type: "presentation",
      color: "text-orange-600 dark:text-orange-400",
    };
  }

  if (type.includes("pdf")) {
    return {
      type: "pdf",
      color: "text-red-600 dark:text-red-400",
    };
  }

  if (
    type.includes("code") ||
    type.includes("json") ||
    type.includes("xml") ||
    type.includes("html")
  ) {
    return {
      type: "code",
      color: "text-purple-600 dark:text-purple-400",
    };
  }

  if (
    type.includes("zip") ||
    type.includes("compress") ||
    type.includes("rar") ||
    type.includes("7z")
  ) {
    return {
      type: "archive",
      color: "text-yellow-600 dark:text-yellow-400",
    };
  }

  if (
    type.includes("audio") ||
    type.includes("mp3") ||
    type.includes("wav") ||
    type.includes("webm")
  ) {
    return {
      type: "audio",
      color: "text-pink-600 dark:text-pink-400",
    };
  }

  if (
    type.includes("video") ||
    type.includes("mp4") ||
    type.includes("avi") ||
    type.includes("mov")
  ) {
    return {
      type: "video",
      color: "text-indigo-600 dark:text-indigo-400",
    };
  }

  if (
    type.includes("image") ||
    type.includes("jpg") ||
    type.includes("jpeg") ||
    type.includes("png") ||
    type.includes("gif") ||
    type.includes("svg")
  ) {
    return {
      type: "image",
      color: "text-teal-600 dark:text-teal-400",
    };
  }

  return {
    type: "default",
    color: "text-primary dark:text-sidebar-primary",
  };
};
