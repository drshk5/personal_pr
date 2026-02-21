import { CRM_API_PREFIX } from "@/constants/api-prefix";
import { ApiService } from "@/lib/api/api-service";

export interface BulkCustomEmailRequest {
  recipients: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
}

const COMMUNICATIONS_PREFIX = `${CRM_API_PREFIX}/communications`;

export const communicationService = {
  sendBulkEmail: async (dto: BulkCustomEmailRequest): Promise<number> => {
    const uniqueRecipients = Array.from(
      new Set((dto.recipients || []).map((e) => e.trim()).filter(Boolean))
    );

    if (uniqueRecipients.length === 0) {
      return 0;
    }

    return await ApiService.post<number>(`${COMMUNICATIONS_PREFIX}/bulk-email`, {
      Recipients: uniqueRecipients,
      Subject: dto.subject,
      Body: dto.body,
      IsHtml: dto.isHtml ?? true,
    });
  },
};
