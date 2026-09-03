import { messagingApi } from '../api/messaging.api';
import type {
  ConversationMessageAttachment,
  ConversationMessageAttachmentKind,
} from '../types/messaging.types';

export type MessageAttachmentUploadSource = {
  uri: string;
  fileName: string;
  mimeType: string;
  kind?: ConversationMessageAttachmentKind;
  metadata?: Record<string, unknown>;
};

export const uploadMessageAttachment = async (
  conversationId: number,
  source: MessageAttachmentUploadSource,
): Promise<ConversationMessageAttachment> => {
  const fileResponse = await fetch(source.uri);
  if (!fileResponse.ok) throw new Error('Unable to read the selected attachment.');
  const body = await fileResponse.blob();

  const sessionResponse = await messagingApi.initAttachmentUpload({
    conversation_id: conversationId,
    file_name: source.fileName,
    mime_type: source.mimeType,
    size: body.size,
    kind: source.kind,
    metadata: source.metadata,
  });
  const session = sessionResponse.data.data;
  const uploadResponse = await fetch(session.upload.url, {
    method: session.upload.method,
    headers: session.upload.headers,
    body,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Attachment upload failed (${uploadResponse.status}).`);
  }

  const completed = await messagingApi.completeAttachmentUpload(session.attachment_id);
  const attachment = completed.data.data as ConversationMessageAttachment & { source_url?: string | null };
  return {
    ...attachment,
    url: attachment.url ?? attachment.source_url ?? null,
  };
};
