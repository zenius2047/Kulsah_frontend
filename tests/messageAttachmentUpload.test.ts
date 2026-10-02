import { afterEach, describe, expect, it, vi } from 'vitest';
import { messagingApi } from '../src/api/messaging.api';
import { uploadMessageAttachment } from '../src/services/messageAttachmentUpload.service';

const source = {
  uri: 'file:///photo.jpg',
  fileName: 'photo.jpg',
  mimeType: 'image/jpeg',
  kind: 'image' as const,
};

describe('message attachment upload', () => {
  afterEach(() => vi.restoreAllMocks());

  it('initializes, uploads, and completes an attachment before returning it', async () => {
    const blob = new Blob(['photo']);
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(blob, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const init = vi.spyOn(messagingApi, 'initAttachmentUpload').mockResolvedValue({
      data: { data: {
        attachment_id: 12,
        upload: { url: 'https://uploads.example.com/12', method: 'PUT', headers: { 'Content-Type': 'image/jpeg' } },
      } },
    } as never);
    const complete = vi.spyOn(messagingApi, 'completeAttachmentUpload').mockResolvedValue({
      data: { data: {
        id: 12,
        kind: 'image',
        mime_type: 'image/jpeg',
        file_name: 'photo.jpg',
        size: blob.size,
        url: null,
        source_url: 'https://cdn.example.com/photo.jpg',
        metadata: {},
      } },
    } as never);

    const attachment = await uploadMessageAttachment(9, source);

    expect(init).toHaveBeenCalledWith(expect.objectContaining({ conversation_id: 9, size: blob.size }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://uploads.example.com/12', expect.objectContaining({ method: 'PUT', body: blob }));
    expect(complete).toHaveBeenCalledWith(12);
    expect(attachment.url).toBe('https://cdn.example.com/photo.jpg');
  });

  it('does not complete an attachment when storage upload fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(new Blob(['photo']), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    vi.spyOn(messagingApi, 'initAttachmentUpload').mockResolvedValue({
      data: { data: {
        attachment_id: 12,
        upload: { url: 'https://uploads.example.com/12', method: 'PUT', headers: {} },
      } },
    } as never);
    const complete = vi.spyOn(messagingApi, 'completeAttachmentUpload');

    await expect(uploadMessageAttachment(9, source)).rejects.toThrow('Attachment upload failed (503).');
    expect(complete).not.toHaveBeenCalled();
  });
});
