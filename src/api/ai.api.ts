import api from './client';
import { endpoints } from './endpoints';

export type AiUseCase =
  | 'audience_retention'
  | 'collaboration_match'
  | 'content_item_strategy'
  | 'content_library_audit'
  | 'creator_analytics_audit'
  | 'creator_identity'
  | 'creator_library_audit'
  | 'creator_power_move'
  | 'live_chat_summary'
  | 'revenue_advice'
  | 'smart_replies'
  | 'sonic_audit'
  | 'store_description'
  | 'ticket_recommendation';

type AiResponse = {
  data: {
    text: string;
    structured?: Record<string, unknown> | null;
  };
};

export const aiApi = {
  async generate(useCase: AiUseCase, context: Record<string, unknown> = {}) {
    const response = await api.post<AiResponse>(endpoints.general.aiGenerate, {
      use_case: useCase,
      context,
    });
    return response.data.data;
  },
};
