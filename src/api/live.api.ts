import api from './client';
import { endpoints } from './endpoints';
import type {
  CreateLivePayload,
  LiveAnalytics,
  LiveBattle,
  LiveCohostAcceptance,
  LiveCohostRequest,
  LiveComment,
  LiveCredentialsResponse,
  LiveHeartbeatPayload,
  LiveLikeResult,
  LiveModerationPayload,
  LivePage,
  LiveSessionResponse,
  SendLiveGiftPayload,
} from '../types/live.types';

type DataEnvelope<T> = { data: T; message?: string };

export const liveApi = {
  discover: (params: { page?: number; per_page?: number } = {}) =>
    api.get<LivePage>(endpoints.general.live, { params }),
  get: (liveSession: string | number) =>
    api.get<LiveSessionResponse>(endpoints.general.liveSession(liveSession)),
  preview: (liveSession: string | number) =>
    api.post<LiveCredentialsResponse>(endpoints.general.livePreview(liveSession)),
  create: (payload: CreateLivePayload) =>
    api.post<LiveSessionResponse>(endpoints.creator.live, payload),
  start: (liveSession: string | number) =>
    api.post<LiveCredentialsResponse>(endpoints.creator.liveStart(liveSession)),
  confirm: (liveSession: string | number) =>
    api.post<LiveSessionResponse>(endpoints.creator.liveConfirm(liveSession)),
  reconnect: (liveSession: string | number) =>
    api.post<LiveSessionResponse>(endpoints.creator.liveReconnect(liveSession)),
  heartbeat: (liveSession: string | number, payload: LiveHeartbeatPayload) =>
    api.post<{ message: string }>(endpoints.creator.liveHeartbeat(liveSession), payload),
  end: (liveSession: string | number, reason: 'creator_ended' | 'provider_failure' | 'network_timeout' = 'creator_ended') =>
    api.post<LiveSessionResponse>(endpoints.creator.liveEnd(liveSession), { reason }),
  join: (liveSession: string | number) =>
    api.post<LiveCredentialsResponse>(endpoints.general.liveJoin(liveSession)),
  leave: (liveSession: string | number) =>
    api.post<{ message: string }>(endpoints.general.liveLeave(liveSession)),
  comment: (liveSession: string | number, body: string) =>
    api.post<DataEnvelope<LiveComment>>(endpoints.general.liveComments(liveSession), { body }),
  like: (liveSession: string | number, count = 1) =>
    api.post<DataEnvelope<LiveLikeResult>>(endpoints.general.liveLikes(liveSession), { count }),
  gift: (liveSession: string | number, payload: SendLiveGiftPayload) =>
    api.post<DataEnvelope<Record<string, unknown>>>(endpoints.general.liveGifts(liveSession), payload),
  report: (liveSession: string | number, payload: { category: string; reason?: string | null }) =>
    api.post<DataEnvelope<Record<string, unknown>>>(endpoints.general.liveReports(liveSession), payload),
  requestCohost: (liveSession: string | number, message?: string | null) =>
    api.post<DataEnvelope<LiveCohostRequest>>(endpoints.general.liveCohostRequests(liveSession), { message }),
  inviteCohost: (liveSession: string | number, payload: { invitee_id: number; message?: string | null }) =>
    api.post<DataEnvelope<LiveCohostRequest>>(endpoints.creator.liveCohostInvite(liveSession), payload),
  acceptCohost: (cohostRequest: string | number) =>
    api.post<DataEnvelope<LiveCohostAcceptance>>(endpoints.general.liveCohostRequestAccept(cohostRequest)),
  declineCohost: (cohostRequest: string | number) =>
    api.post<DataEnvelope<LiveCohostRequest>>(endpoints.general.liveCohostRequestDecline(cohostRequest)),
  removeCohost: (liveSession: string | number, user: string | number, reason?: string | null) =>
    api.delete<DataEnvelope<Record<string, unknown>>>(endpoints.creator.liveCohostRemove(liveSession, user), {
      data: { reason },
    }),
  inviteBattle: (liveSession: string | number, opponentLiveSessionPublicId: string) =>
    api.post<DataEnvelope<LiveBattle>>(endpoints.creator.liveBattleInvite(liveSession), {
      opponent_live_session_public_id: opponentLiveSessionPublicId,
    }),
  acceptBattle: (battle: string | number) =>
    api.post<DataEnvelope<LiveBattle>>(endpoints.general.liveBattleAccept(battle)),
  scoreBattle: (battle: string | number) =>
    api.post<DataEnvelope<LiveBattle>>(endpoints.general.liveBattleScore(battle)),
  endBattle: (battle: string | number) =>
    api.post<DataEnvelope<LiveBattle>>(endpoints.general.liveBattleEnd(battle)),
  moderate: (liveSession: string | number, payload: LiveModerationPayload) =>
    api.post<DataEnvelope<Record<string, unknown>>>(endpoints.creator.liveModerate(liveSession), payload),
  analytics: (liveSession: string | number) =>
    api.get<DataEnvelope<LiveAnalytics>>(endpoints.creator.liveAnalytics(liveSession)),
};
