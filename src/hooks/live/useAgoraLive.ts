import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChannelProfileType,
  ClientRoleType,
  ConnectionStateType,
  createAgoraRtcEngine,
  type ErrorCodeType,
  type IRtcEngine,
  type IRtcEngineEventHandler,
  type RtcConnection,
  VideoSourceType,
} from 'react-native-agora';
import type { LiveCredentials } from '../../types/live.types';

export type AgoraLiveConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

type UseAgoraLiveOptions = {
  credentials?: LiveCredentials | null;
  enabled?: boolean;
  remoteAudioMuted?: boolean;
  onJoined?: () => void | Promise<void>;
  onReconnected?: () => void | Promise<void>;
  renewCredentials?: () => Promise<LiveCredentials>;
};

const agoraError = (code: number) => `Agora could not connect (error ${code}).`;

const assertAgoraResult = (result: number, action: string) => {
  if (result < 0) throw new Error(`${action} failed (${result}).`);
};

export const useAgoraLive = ({
  credentials,
  enabled = true,
  remoteAudioMuted = false,
  onJoined,
  onReconnected,
  renewCredentials,
}: UseAgoraLiveOptions) => {
  const engineRef = useRef<IRtcEngine | null>(null);
  const onJoinedRef = useRef(onJoined);
  const onReconnectedRef = useRef(onReconnected);
  const renewCredentialsRef = useRef(renewCredentials);
  const hasConnectedRef = useRef(false);
  const [connectionState, setConnectionState] = useState<AgoraLiveConnectionState>('idle');
  const [remoteUids, setRemoteUids] = useState<number[]>([]);
  const [networkQuality, setNetworkQuality] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [localPreviewReady, setLocalPreviewReady] = useState(false);

  onJoinedRef.current = onJoined;
  onReconnectedRef.current = onReconnected;
  renewCredentialsRef.current = renewCredentials;

  useEffect(() => {
    if (!enabled || !credentials) return;
    let disposed = false;
    const isBroadcaster = credentials.role === 'broadcaster';
    const engine = createAgoraRtcEngine();
    engineRef.current = engine;
    setConnectionState('connecting');
    setError(null);
    setLocalPreviewReady(false);

    const handler: IRtcEngineEventHandler = {
      onJoinChannelSuccess: () => {
        if (disposed) return;
        const wasConnected = hasConnectedRef.current;
        hasConnectedRef.current = true;
        setConnectionState('connected');
        void (wasConnected ? onReconnectedRef.current?.() : onJoinedRef.current?.());
      },
      onRejoinChannelSuccess: () => {
        if (disposed) return;
        hasConnectedRef.current = true;
        setConnectionState('connected');
        void onReconnectedRef.current?.();
      },
      onUserJoined: (_connection: RtcConnection, remoteUid: number) => {
        if (!disposed) setRemoteUids((current) => current.includes(remoteUid) ? current : [...current, remoteUid]);
      },
      onUserOffline: (_connection: RtcConnection, remoteUid: number) => {
        if (!disposed) setRemoteUids((current) => current.filter((uid) => uid !== remoteUid));
      },
      onConnectionStateChanged: (_connection, state) => {
        if (disposed) return;
        if (state === ConnectionStateType.ConnectionStateReconnecting) setConnectionState('reconnecting');
        if (state === ConnectionStateType.ConnectionStateConnected) setConnectionState('connected');
        if (state === ConnectionStateType.ConnectionStateFailed) setConnectionState('failed');
        if (state === ConnectionStateType.ConnectionStateDisconnected && hasConnectedRef.current) {
          setConnectionState('reconnecting');
        }
      },
      onNetworkQuality: (_connection, _remoteUid, txQuality, rxQuality) => {
        if (!disposed) setNetworkQuality(Math.max(Number(txQuality) || 0, Number(rxQuality) || 0));
      },
      onTokenPrivilegeWillExpire: () => {
        const renew = renewCredentialsRef.current;
        if (!renew) return;
        void renew()
          .then((nextCredentials) => engine.renewToken(nextCredentials.token))
          .catch((caught) => {
            if (!disposed) setError(caught instanceof Error ? caught.message : 'Live credentials could not be renewed.');
          });
      },
      onError: (code: ErrorCodeType) => {
        if (!disposed) {
          setError(agoraError(Number(code)));
          setConnectionState('failed');
        }
      },
    };

    try {
      engine.initialize({ appId: credentials.app_id });
      engine.registerEventHandler(handler);
      engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
      engine.setClientRole(
        isBroadcaster
          ? ClientRoleType.ClientRoleBroadcaster
          : ClientRoleType.ClientRoleAudience,
      );
      assertAgoraResult(engine.enableAudio(), 'Agora audio setup');
      assertAgoraResult(engine.enableVideo(), 'Agora video setup');
      assertAgoraResult(engine.muteAllRemoteAudioStreams(remoteAudioMuted), 'Agora remote audio setup');
      if (isBroadcaster) {
        assertAgoraResult(engine.enableLocalVideo(true), 'Agora camera setup');
        assertAgoraResult(engine.muteLocalVideoStream(false), 'Agora video publishing setup');
        assertAgoraResult(engine.startPreview(VideoSourceType.VideoSourceCameraPrimary), 'Agora camera preview');
        setLocalPreviewReady(true);
      }
      const result = engine.joinChannel(credentials.token, credentials.channel, credentials.uid, {
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        clientRoleType: isBroadcaster
          ? ClientRoleType.ClientRoleBroadcaster
          : ClientRoleType.ClientRoleAudience,
        publishCameraTrack: isBroadcaster,
        publishMicrophoneTrack: isBroadcaster,
        autoSubscribeAudio: !isBroadcaster,
        autoSubscribeVideo: !isBroadcaster,
      });
      if (result < 0) throw new Error(agoraError(result));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Agora could not start.');
      setConnectionState('failed');
    }

    return () => {
      disposed = true;
      hasConnectedRef.current = false;
      setRemoteUids([]);
      setLocalPreviewReady(false);
      try {
        engine.unregisterEventHandler(handler);
        engine.stopPreview();
        engine.leaveChannel();
        engine.release();
      } catch {
        // Native cleanup is best effort while a screen is being removed.
      }
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [
    credentials?.app_id,
    credentials?.channel,
    credentials?.role,
    credentials?.uid,
    enabled,
    remoteAudioMuted,
  ]);

  useEffect(() => {
    if (credentials?.token && engineRef.current && hasConnectedRef.current) {
      engineRef.current.renewToken(credentials.token);
    }
  }, [credentials?.token]);

  const setMuted = useCallback((muted: boolean) => {
    engineRef.current?.muteLocalAudioStream(muted);
  }, []);

  const setVideoEnabled = useCallback((videoEnabled: boolean) => {
    engineRef.current?.muteLocalVideoStream(!videoEnabled);
  }, []);

  const switchCamera = useCallback(() => {
    engineRef.current?.switchCamera();
  }, []);

  const setRemoteAudioMuted = useCallback((muted: boolean) => {
    engineRef.current?.muteAllRemoteAudioStreams(muted);
  }, []);

  return {
    connectionState,
    error,
    localPreviewReady,
    networkQuality,
    remoteUids,
    setMuted,
    setVideoEnabled,
    setRemoteAudioMuted,
    switchCamera,
  };
};
