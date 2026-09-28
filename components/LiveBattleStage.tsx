import React from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { RenderModeType, RtcSurfaceView, RtcTextureView, VideoSourceType } from 'react-native-agora';
import type { LiveCredentials, LiveParticipants } from '../src/types/live.types';
import { buildBattleTiles } from '../src/utils/liveBattle';

type Props = {
  stage: NonNullable<LiveParticipants['battle_stage']>;
  credentials: LiveCredentials | null;
  remoteUids: number[];
  localPreviewReady: boolean;
  top: number;
};

export default function LiveBattleStage({ stage, credentials, remoteUids, localPreviewReady, top }: Props) {
  const { height } = useWindowDimensions();
  const tiles = buildBattleTiles(stage, credentials, remoteUids, localPreviewReady);
  const joined = tiles.filter((tile) => tile.connected).length;
  const ready = stage.all_accepted && joined === tiles.length && tiles.length > 1;
  const Video = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;
  const rows = Math.ceil(tiles.length / 2);
  return <View pointerEvents="none" style={[styles.stage, { top, height: Math.min(440, height * 0.48) }]}>
    <View style={styles.header}>
      <Text style={styles.title}>LIVE BATTLE</Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>{ready ? 'Everyone is here' : `Joining · ${joined}/${tiles.length}`}</Text>
    </View>
    <View style={styles.grid}>
      {tiles.map((tile, index) => <View key={tile.user_id} style={[styles.tile, { width: tiles.length === 1 ? '100%' : '50%', height: `${100 / rows}%` }]}>
        <View style={styles.video}>
          {tile.connected ? <Video
            canvas={{ uid: tile.local ? 0 : tile.rtc_uid,
              sourceType: tile.local ? VideoSourceType.VideoSourceCameraPrimary : VideoSourceType.VideoSourceRemote,
              renderMode: RenderModeType.RenderModeHidden }}
            style={StyleSheet.absoluteFill}
          /> : <View style={styles.waiting}>
            <Text style={styles.initial}>{tile.name.slice(0, 1).toUpperCase()}</Text>
            <Text style={styles.status}>{tile.accepted ? 'Connecting video…' : 'Waiting to accept'}</Text>
          </View>}
          <View style={styles.label}>
            <Text numberOfLines={1} style={styles.name}>{tile.name}{tile.local ? ' (You)' : ''}</Text>
            <Text style={styles.role}>{index === 0 ? 'HOST' : 'PARTICIPANT'}</Text>
          </View>
        </View>
      </View>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  stage: { position: 'absolute', left: 8, right: 8, zIndex: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#271138', borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  title: { color: '#fff', fontWeight: '800', fontSize: 14 },
  status: { color: '#ded3ea', fontSize: 12 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#271138' },
  tile: { padding: 3 },
  video: { flex: 1, backgroundColor: '#17121e', borderRadius: 10, overflow: 'hidden' },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  initial: { color: '#fff', fontSize: 34, fontWeight: '700' },
  label: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 8, backgroundColor: '#0009' },
  name: { color: '#fff', fontSize: 13, fontWeight: '600' },
  role: { color: '#e6b8ff', fontSize: 9, marginTop: 2 },
});
