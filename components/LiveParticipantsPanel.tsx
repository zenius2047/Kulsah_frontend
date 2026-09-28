import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { liveApi } from '../src/api/live.api';
import { liveQueryKeys, useLiveParticipants } from '../src/hooks/live/useLive';
import { useAuthStore } from '../src/store/auth.store';
import type { LiveCommentUser, LiveCredentials, LiveModerationPayload, LiveParticipants } from '../src/types/live.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { PRIMARY_COLOR } from '../theme';

type Props = {
  liveSessionId: string;
  creator?: boolean;
  enabled: boolean;
  broadcasting?: boolean;
  onCredentials?: (credentials: LiveCredentials | null) => void;
  onMute?: (muted: boolean) => void;
  onCamera?: () => void;
  initiallyOpen?: boolean;
  initialTab?: 'guests' | 'viewers' | 'battles';
  showInviteButton?: boolean;
  showGuestButton?: boolean;
};

export default function LiveParticipantsPanel({ liveSessionId, creator = false, enabled, broadcasting, onCredentials, onMute, onCamera, initiallyOpen = false, initialTab = 'guests', showInviteButton = false, showGuestButton = true }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(initiallyOpen);
  const [tab, setTab] = useState<'guests' | 'viewers' | 'battles'>(initialTab);
  const didAutoOpen = useRef(initiallyOpen);
  useEffect(() => {
    if (initiallyOpen && !didAutoOpen.current) {
      didAutoOpen.current = true;
      setOpen(true);
    }
  }, [initiallyOpen]);
  const [search, setSearch] = useState('');
  const [creatorSearch, setCreatorSearch] = useState('');
  const creatorSearchWords = creatorSearch.trim().toLowerCase().split(/\s+/)
    .map((word) => word.replace(/^@/, '')).filter(Boolean);
  const normalizedCreatorSearch = creatorSearchWords.join(' ');
  const [invitationFeedback, setInvitationFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [managedViewer, setManagedViewer] = useState<number | null>(null);
  const userId = useAuthStore((state) => state.user?.id);
  const insets = useSafeAreaInsets();
  const [, requestCamera] = useCameraPermissions();
  const [, requestMicrophone] = useMicrophonePermissions();
  const participants = useLiveParticipants(liveSessionId, enabled);
  const discovery = useInfiniteQuery({
    queryKey: ['live', 'invite-creators', liveSessionId, normalizedCreatorSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => liveApi.battleCreators(liveSessionId, { page: pageParam, search_query: normalizedCreatorSearch, limit: 30 })
      .then((response) => response.data),
    getNextPageParam: (page) => page.meta.has_more ? page.meta.current_page + 1 : undefined,
    refetchInterval: 15000,
    enabled: enabled && open && creator && tab === 'battles',
  });
  const data = participants.data;
  const requests = data?.requests ?? [];
  const pending = requests.filter((r) => ['pending', 'accepted'].includes(r.status));
  const myRequest = requests.find((r) => String(r.requester_id) === String(userId));
  const myActive = data?.cohosts.some((c) => String(c.user_id) === String(userId));
  const actionable = creator
    ? pending.filter((r) => r.status === 'pending' && String(r.invitee_id) === String(userId)).length
      + (data?.battles.filter((battle) => battle.status === 'pending' && String(battle.opponent_id) === String(userId)).length ?? 0)
    : pending.filter((r) => r.status === 'accepted' || String(r.invitee_id) === String(userId)).length;

  const run = async (action: () => Promise<unknown>) => {
    if (busyRef.current || !enabled) return;
    busyRef.current = true;
    setBusy(true);
    setInvitationFeedback('');
    try {
      await action();
      await participants.refetch();
    } catch (error) {
      Alert.alert('Live action failed', getApiErrorMessage(error));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const inviteCreator = async (opponentId: number, name: string) => {
    const battle = (await liveApi.inviteBattle(liveSessionId, opponentId)).data.data;
    queryClient.setQueryData<LiveParticipants>(liveQueryKeys.participants(liveSessionId), (current) => current ? {
      ...current,
      battles: [...current.battles.filter((item) => item.id !== battle.id), battle],
    } : current);
    setInvitationFeedback(`Battle invitation sent to ${name}. Waiting for them to accept.`);
  };
  const matchingCreators = Array.from(new Map(
    (discovery.data?.pages.flatMap((page) => page.data) ?? []).map((candidate) => [candidate.id, candidate]),
  ).values()).filter((candidate) => String(candidate.id) !== String(userId)
    && candidate.is_online
    && creatorSearchWords.every((word) =>
      `${candidate.name ?? ''} ${candidate.handle ?? ''}`.toLowerCase().includes(word)));
  const acceptBattle = async (battleId: number) => {
    if (!creator) {
      const camera = await requestCamera();
      const microphone = await requestMicrophone();
      if (!camera.granted || !microphone.granted) {
        Alert.alert('Camera and microphone required', 'Enable camera and microphone access to join the battle.');
        return;
      }
    }
    const response = await liveApi.acceptBattle(battleId);
    if (response.data.credentials) {
      await participants.refetch();
      onCredentials?.(response.data.credentials);
      setOpen(false);
    }
  };
  const joinStage = async (requestId?: number) => {
    const camera = await requestCamera();
    const microphone = await requestMicrophone();
    if (!camera.granted || !microphone.granted) {
      Alert.alert('Camera and microphone required', 'Enable camera and microphone access in Settings to join as a co-host.');
      return;
    }
    const credentials = requestId == null
      ? (await liveApi.cohostCredentials(liveSessionId)).data.data
      : (await liveApi.acceptCohost(requestId)).data.data.credentials;
    if (credentials) {
      await participants.refetch();
      setMuted(false);
      onCredentials?.(credentials);
      setOpen(false);
    }
  };
  const button = (label: string, action: () => Promise<unknown>, secondary = false) => (
    <Pressable accessibilityRole="button" disabled={busy || !enabled} onPress={() => void run(action)}
      style={[styles.button, secondary && styles.secondary, (busy || !enabled) && styles.disabled]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
  const person = (user?: LiveCommentUser, fallback?: number) => (
    <View style={styles.person}>
      {user?.avatar ? <Image source={{ uri: user.avatar }} style={styles.avatar} />
        : <View style={[styles.avatar, styles.placeholder]}><MaterialIcons name="person" color="#fff" size={22} /></View>}
      <Text style={styles.name}>{user?.name ?? user?.username ?? `Viewer #${fallback}`}</Text>
    </View>
  );
  const moderationActions: { text: string; action: LiveModerationPayload['action'] }[] = [
      { text: 'Mute chat', action: 'mute' }, { text: 'Unmute chat', action: 'unmute' },
      { text: 'Remove viewer', action: 'remove' }, { text: 'Ban from live', action: 'ban_from_live' },
      { text: 'Unban from live', action: 'unban_from_live' },
  ];

  return <>
    {creator && showInviteButton && <Pressable
      accessibilityRole="button"
      accessibilityLabel="Invite an online creator to battle"
      disabled={!enabled}
      onPress={() => { setTab('battles'); setOpen(true); }}
      style={[styles.trigger, !enabled && styles.disabled]}
    >
      <MaterialIcons name="person-add" size={25} color="#fff" />
      <Text style={styles.triggerText}>Invite</Text>
    </Pressable>}
    {showGuestButton && <Pressable accessibilityRole="button" accessibilityLabel={`Manage live guests${actionable ? `, ${actionable} pending` : ''}`}
      disabled={!enabled} onPress={() => setOpen(true)} style={styles.trigger}>
      <MaterialIcons name="group" size={25} color="#fff" />
      <Text style={styles.triggerText}>{actionable ? `Guests (${actionable})` : broadcasting ? 'Co-hosting' : 'Guests'}</Text>
    </Pressable>}
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} accessibilityLabel="Close guests" onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{creator ? 'Manage Live' : 'Join the conversation'}</Text>
            <Pressable accessibilityLabel="Close" onPress={() => setOpen(false)}><MaterialIcons name="close" size={28} color="#fff" /></Pressable>
          </View>
          {creator && <View style={styles.actions}>{(['guests', 'viewers', 'battles'] as const).map((value) =>
            <Pressable key={value} onPress={() => setTab(value)} style={[styles.button, tab !== value && styles.secondary]}><Text style={styles.buttonText}>{value[0].toUpperCase() + value.slice(1)}</Text></Pressable>
          )}</View>}
          {busy && <ActivityIndicator color={PRIMARY_COLOR} />}
          {Boolean(invitationFeedback) && <Text accessibilityLiveRegion="polite" style={styles.description}>{invitationFeedback}</Text>}
          {!enabled && <Text style={styles.description}>Guest controls are available when connected to an active Live.</Text>}
          {participants.isLoading && <ActivityIndicator color="#fff" />}
          {participants.isError && <View><Text style={styles.description}>{getApiErrorMessage(participants.error)}</Text>{button('Retry', () => participants.refetch())}</View>}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {tab === 'guests' && <>
              {!creator && <View style={styles.card}>
                <Text style={styles.name}>{broadcasting ? 'You are co-hosting' : 'Share the stage'}</Text>
                <Text style={styles.description}>{broadcasting ? 'Your camera is live. You can leave the stage and keep watching.' : 'Your camera and microphone only turn on when you choose to join.'}</Text>
                {broadcasting ? <>
                  {button(muted ? 'Unmute microphone' : 'Mute microphone', async () => { onMute?.(!muted); setMuted(!muted); }, true)}
                  {button('Switch camera', async () => onCamera?.(), true)}
                  {button('Leave stage', async () => { onCredentials?.(null); await liveApi.leaveCohost(liveSessionId); })}
                </> : myActive ? button('Rejoin as co-host', () => joinStage()) :
                  !pending.length && button('Request to join Live', () => liveApi.requestCohost(liveSessionId))}
                {!broadcasting && myRequest && !['pending', 'accepted', 'active'].includes(myRequest.status) &&
                  <Text style={styles.description}>Previous request: {myRequest.status}</Text>}
              </View>}
              <Text style={styles.section}>Requests & invitations</Text>
              {!pending.length && <Text style={styles.description}>No pending requests.</Text>}
              {pending.map((request) => <View key={request.id} style={styles.card}>
                {person(request.requester, request.requester_id)}
                <Text style={styles.description}>{request.status === 'accepted' ? 'Approved — ready to join' : String(request.requested_by_id) === String(request.requester_id) ? creator ? 'Wants to join your Live' : 'Waiting for the creator to approve' : 'Invited to co-host'}</Text>
                {request.message && <Text style={styles.description}>{request.message}</Text>}
                <View style={styles.actions}>
                  {creator && request.status === 'pending' && String(request.invitee_id) === String(userId) && button('Approve', () => liveApi.acceptCohost(request.id))}
                  {!creator && (request.status === 'accepted' || String(request.invitee_id) === String(userId)) && button('Accept & join', () => joinStage(request.id))}
                  {button(String(request.requested_by_id) === String(userId) ? 'Cancel request' : 'Decline', () => liveApi.declineCohost(request.id), true)}
                </View>
              </View>)}
              <Text style={styles.section}>On stage</Text>
              {!data?.cohosts.length && <Text style={styles.description}>No co-hosts yet.</Text>}
              {data?.cohosts.map((cohost) => <View key={cohost.id} style={styles.card}>
                {person(cohost.user, cohost.user_id)}
                {creator && button('Remove co-host', () => liveApi.removeCohost(liveSessionId, cohost.user_id), true)}
              </View>)}
            </>}
            {creator && tab === 'viewers' && <>
              <TextInput value={search} onChangeText={setSearch} placeholder="Find a viewer" placeholderTextColor="#aaa" style={styles.input} />
              <Text style={styles.description}>Invite someone watching this Live to co-host.</Text>
              {!data?.viewers.length && <Text style={styles.description}>Viewers will appear here when they join.</Text>}
              {data?.viewers.filter((v) => `${v.name} ${v.username}`.toLowerCase().includes(search.toLowerCase())).map((viewer) => <View key={viewer.id} style={styles.card}>
                {person(viewer, viewer.id)}
                <View style={styles.actions}>
                  {data.cohosts.some((c) => c.user_id === viewer.id) ? <Text style={styles.description}>Co-hosting</Text> : pending.some((r) => r.requester_id === viewer.id) ? <Text style={styles.description}>Request pending</Text> : button('Invite co-host', () => liveApi.inviteCohost(liveSessionId, { invitee_id: viewer.id }))}
                  <Pressable disabled={busy} onPress={() => setManagedViewer(managedViewer === viewer.id ? null : viewer.id)} style={[styles.button, styles.secondary]}><Text style={styles.buttonText}>Manage</Text></Pressable>
                </View>
                {managedViewer === viewer.id && <View style={styles.actions}>{moderationActions.map(({ text, action }) =>
                  <View key={action}>{button(text, () => liveApi.moderate(liveSessionId, { target_id: viewer.id, action }), true)}</View>
                )}</View>}
              </View>)}
            </>}
            {((creator && tab === 'battles') || (!creator && Boolean(data?.battles.length))) && <>
              <Text style={styles.section}>Your battles</Text>
              {!data?.battles.length && <Text style={styles.description}>No battle invitations yet.</Text>}
              {data?.battles.map((battle) => <View key={battle.id} style={styles.card}>
                <Text style={styles.name}>Battle · {battle.status}</Text>
                {battle.status === 'pending' && <Text style={styles.description}>{String(battle.opponent_id) === String(userId) ? 'You have been invited to battle. Accept to join.' : 'Invitation sent. Waiting for the other creator to accept.'}</Text>}
                <Text style={styles.description}>{battle.metadata?.shared_stage ? 'Shared stream · Separate battle scores are not available yet' : `${battle.creator_score} — ${battle.opponent_score}`}</Text>
                <View style={styles.actions}>
                  {battle.status === 'pending' && String(battle.opponent_id) === String(userId) && button('Accept battle', () => acceptBattle(battle.id))}
                  {battle.status === 'active' && !battle.metadata?.shared_stage && button('Refresh score', () => liveApi.scoreBattle(battle.id), true)}
                  {['pending', 'accepted', 'active'].includes(battle.status) && button(battle.status === 'pending' ? String(battle.opponent_id) === String(userId) ? 'Decline invitation' : 'Cancel invitation' : 'End battle', () => liveApi.endBattle(battle.id), true)}
                </View>
              </View>)}
              {creator && <>
              <Text style={styles.section}>Invite an online creator</Text>
              <Text style={styles.description}>Invite a creator who is online. They can join your stream without starting their own Live.</Text>
              <TextInput accessibilityLabel="Find an online creator" value={creatorSearch} onChangeText={setCreatorSearch} maxLength={255} placeholder="Search creators" placeholderTextColor="#aaa" style={styles.input} />
              {discovery.isLoading && <ActivityIndicator color="#fff" />}
              {discovery.isError && <View><Text style={styles.description}>{getApiErrorMessage(discovery.error)}</Text>{button('Retry live discovery', () => discovery.refetch())}</View>}
              {!discovery.isLoading && !discovery.isError && !matchingCreators.length && <Text style={styles.description}>{normalizedCreatorSearch ? `No online creators matching "${creatorSearch.trim()}".` : 'No other creators are online right now.'}</Text>}
              {matchingCreators.map((candidate) => {
                const existingBattle = data?.battles.find((battle) => ['pending', 'accepted', 'active'].includes(battle.status)
                  && (String(battle.creator_id) === String(candidate.id) || String(battle.opponent_id) === String(candidate.id)));
                return <View key={candidate.id} style={styles.card}>
                  <View style={styles.person}>
                    {candidate.avatar_url ? <Image source={{ uri: candidate.avatar_url }} style={styles.avatar} /> : <View style={[styles.avatar, styles.placeholder]}><MaterialIcons name="person" color="#fff" size={22} /></View>}
                    <Text style={styles.name}>{candidate.name}</Text>
                  </View>
                  <Text style={styles.description}>{candidate.handle} · Online</Text>
                  {existingBattle ? <Text style={styles.description}>{existingBattle.status === 'pending' ? String(existingBattle.opponent_id) === String(userId) ? 'Incoming invitation — respond above' : 'Invitation pending' : 'Battle already in progress'}</Text>
                    : data && !participants.isError ? button('Invite to battle', () => inviteCreator(candidate.id, candidate.name)) : null}
                </View>;
              })}
              {discovery.isFetchingNextPage ? <ActivityIndicator color="#fff" /> : discovery.hasNextPage && button('Load more', () => discovery.fetchNextPage(), true)}
              {button('Refresh creators', () => discovery.refetch(), true)}
              </>}
            </>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  trigger: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  triggerText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { backgroundColor: '#18131f', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  section: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 12 },
  content: { gap: 12, paddingBottom: 16 },
  card: { padding: 14, borderRadius: 16, backgroundColor: '#ffffff0d', gap: 10 },
  name: { color: '#fff', fontSize: 15, fontWeight: '600', flexShrink: 1 },
  description: { color: '#c9c3d0', fontSize: 13, lineHeight: 19 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  placeholder: { backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  button: { backgroundColor: PRIMARY_COLOR, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  secondary: { backgroundColor: '#ffffff18' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  input: { color: '#fff', padding: 12, borderRadius: 12, backgroundColor: '#ffffff12' },
});
