import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

const tones = (isDark: boolean) => ({
  background: isDark ? '#080a10' : '#f6f7f9',
  base: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)',
  strong: isDark ? 'rgba(255,255,255,0.11)' : 'rgba(15,23,42,0.12)',
});

const Line = ({ width, color, height = 12 }: { width: `${number}%`; color: string; height?: number }) =>
  <View style={{ width, height, borderRadius: height / 2, backgroundColor: color }} />;

export const PageSkeleton = ({ isDark, variant = 'detail' }: { isDark: boolean; variant?: 'detail' | 'tickets' }) => {
  const color = tones(isDark);
  return (
    <ScrollView accessibilityRole="progressbar" accessibilityLabel="Loading page" scrollEnabled={false} style={{ flex: 1, backgroundColor: color.background }} contentContainerStyle={styles.page}>
      <View style={styles.headerRow}>
        <View style={[styles.roundButton, { backgroundColor: color.strong }]} />
        <View style={styles.headerLines}><Line width="42%" color={color.strong} height={15} /><Line width="28%" color={color.base} height={9} /></View>
      </View>
      {variant === 'detail' ? <View style={[styles.hero, { backgroundColor: color.strong }]} /> : null}
      <View style={styles.copy}><Line width="86%" color={color.strong} /><Line width="68%" color={color.base} /><Line width="76%" color={color.base} /></View>
      <View style={styles.twoColumns}>
        {[0, 1, 2, 3].map((item) => <View key={item} style={[styles.tile, { backgroundColor: item < 2 ? color.strong : color.base }]} />)}
      </View>
      <View style={[styles.panel, { backgroundColor: color.base }]}>
        <Line width="48%" color={color.strong} height={14} /><Line width="92%" color={color.strong} /><Line width="74%" color={color.strong} />
      </View>
    </ScrollView>
  );
};

export const ListSkeleton = ({ isDark, count = 4 }: { isDark: boolean; count?: number }) => {
  const color = tones(isDark);
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading list" style={styles.list}>
      {Array.from({ length: count }, (_, item) => (
        <View key={item} style={[styles.listCard, { backgroundColor: color.base }]}>
          <View style={[styles.thumbnail, { backgroundColor: color.strong }]} />
          <View style={styles.listCopy}><Line width="82%" color={color.strong} height={13} /><Line width="58%" color={color.strong} height={10} /><Line width="70%" color={color.base} height={9} /></View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  page: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 40, gap: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  roundButton: { width: 42, height: 42, borderRadius: 21 },
  headerLines: { flex: 1, gap: 8 },
  hero: { height: 310, borderRadius: 20 },
  copy: { gap: 10 },
  twoColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48.5%', height: 84, borderRadius: 14 },
  panel: { borderRadius: 18, padding: 18, gap: 13 },
  list: { paddingVertical: 16, gap: 14 },
  listCard: { minHeight: 128, borderRadius: 18, padding: 12, flexDirection: 'row', gap: 14 },
  thumbnail: { width: 104, minHeight: 104, borderRadius: 14 },
  listCopy: { flex: 1, justifyContent: 'center', gap: 11 },
});
