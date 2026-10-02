import api from './client';
import { endpoints } from './endpoints';
import type { LiveCredentials } from '../types/live.types';
import type { VoiceCall } from '../types/messaging.types';

type CallEnvelope = { data: VoiceCall; credentials?: LiveCredentials };

export const voiceCallApi = {
  start: (conversation: string | number) =>
    api.post<CallEnvelope>(endpoints.general.conversationVoiceCalls(conversation)),
  get: (call: string | number) => api.get<{ data: VoiceCall }>(endpoints.general.voiceCall(call)),
  accept: (call: string | number) => api.post<CallEnvelope>(endpoints.general.voiceCallAccept(call)),
  decline: (call: string | number) => api.post<{ data: VoiceCall }>(endpoints.general.voiceCallDecline(call)),
  end: (call: string | number) => api.post<{ data: VoiceCall }>(endpoints.general.voiceCallEnd(call)),
  credentials: (call: string | number) =>
    api.post<{ credentials: LiveCredentials }>(endpoints.general.voiceCallCredentials(call)),
};
