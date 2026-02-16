export interface UploadConfig {
  maxFilesPerUpload: number;
  maxFileSizeMB: number;
}

export interface ModuleUploadLimits {
  invoice: UploadConfig;
  "purchase-invoice": UploadConfig;
  journalVoucher: UploadConfig;
  party: UploadConfig;
  task: UploadConfig;
  item: UploadConfig;
  paymentReceipt: UploadConfig;
  paymentMade: UploadConfig;
  default: UploadConfig;
}

export const uploadLimits: ModuleUploadLimits = {
  invoice: {
    maxFilesPerUpload: 5,
    maxFileSizeMB: 10,
  },
  "purchase-invoice": {
    maxFilesPerUpload: 5,
    maxFileSizeMB: 10,
  },
  journalVoucher: {
    maxFilesPerUpload: 5,
    maxFileSizeMB: 10,
  },
  party: {
    maxFilesPerUpload: 5,
    maxFileSizeMB: 10,
  },
  task: {
    maxFilesPerUpload: 10,
    maxFileSizeMB: 10,
  },
  item: {
    maxFilesPerUpload: 5,
    maxFileSizeMB: 10,
  },
  paymentReceipt: {
    maxFilesPerUpload: 5,
    maxFileSizeMB: 10,
  },
  paymentMade: {
    maxFilesPerUpload: 5,
    maxFileSizeMB: 10,
  },
  default: {
    maxFilesPerUpload: 5,
    maxFileSizeMB: 10,
  },
};

export type ModuleType = keyof Omit<ModuleUploadLimits, "default">;

export const getUploadConfig = (module?: ModuleType): UploadConfig => {
  if (!module || !(module in uploadLimits)) {
    return uploadLimits.default;
  }
  return uploadLimits[module];
};
