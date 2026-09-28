import type { LiveCredentials, LiveParticipants } from '../types/live.types';

export const buildBattleTiles = (
  stage: NonNullable<LiveParticipants['battle_stage']>,
  credentials: LiveCredentials | null,
  remoteUids: number[],
  localPreviewReady: boolean,
) => stage.participants.map((participant) => {
  const local = credentials?.role === 'broadcaster' && credentials.uid === participant.rtc_uid;
  return {
    ...participant,
    local,
    connected: participant.accepted && (local ? localPreviewReady : remoteUids.includes(participant.rtc_uid)),
  };
});
