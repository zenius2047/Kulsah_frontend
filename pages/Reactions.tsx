import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontScale } from '../fonts';
import { useThemeMode } from '../theme';

type ReactionTab = 'Emoji' | 'Stickers' | 'Gifts';

type ReactionComment = {
  id: string;
  handle: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  verified?: boolean;
  reply?: {
    handle: string;
    avatar: string;
    text: string;
    time: string;
  };
};

const commentsSeed: ReactionComment[] = [
  {
    id: '1',
    handle: '@pixel_warrior',
    avatar: 'https://picsum.photos/seed/pixel-warrior/120',
    text: 'That drop was absolutely legendary! The lighting sync is next level tonight. Fire.',
    time: '2m',
    likes: 12,
    reply: {
      handle: '@luna_codes',
      avatar: 'https://picsum.photos/seed/luna-codes/120',
      text: "Totally agree! Who's the VJ?",
      time: '1m',
    },
  },
  {
    id: '2',
    handle: '@serena_vibe',
    avatar: 'https://picsum.photos/seed/serena-vibe/120',
    text: 'Can we talk about the visuals? Neon Pulse never misses. Best stream of the month!',
    time: '5m',
    likes: 42,
    verified: true,
  },
];

const Reactions: React.FC<{ onClose: () => void; title?: string }> = ({ onClose, title = 'Reactions' }) => {
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ReactionTab>('Emoji');
  const [replyingTo, setReplyingTo] = useState<string | null>('@pixel_warrior');
  const [message, setMessage] = useState('');

  const shellBackground = isDark ? 'rgba(10,5,13,0.92)' : 'rgba(255,255,255,0.96)';
  const cardBackground = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)';
  const softBorder = theme.border;
  const muted = theme.textMuted;
  const secondary = theme.textSecondary;
  const commentText = isDark ? '#d0c1d8' : theme.textSecondary;
  const sheetHeight = useMemo(() => 0.85, []);

  return (
    <View style={styles.modalFrame}>
      <View style={styles.backdrop}>
        {/* <Image source={{ uri: 'https://picsum.photos/seed/neon-pulse-bg/1200/1800' }} style={styles.bgImage} /> */}
        <LinearGradient colors={['rgba(10,5,13,0.82)', 'rgba(10,5,13,0.28)', 'rgba(10,5,13,0.95)']} style={StyleSheet.absoluteFillObject} />
      </View>

      <View style={[styles.sheet, { height: `${sheetHeight * 100}%`, backgroundColor: shellBackground, borderTopColor: softBorder }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconButton}>
            <MaterialIcons name="close" size={22} color={secondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
          <Pressable style={styles.iconButton}>
            <MaterialIcons name="settings" size={22} color={secondary} />
          </Pressable>
        </View>

        <View style={styles.tabsRow}>
          {([
            { label: 'Emoji', icon: 'mood' },
            { label: 'Stickers', icon: 'sticky-note-2' },
            { label: 'Gifts', icon: 'redeem' },
          ] as const).map((tab) => {
            const active = activeTab === tab.label;
            return (
              <Pressable key={tab.label} onPress={() => setActiveTab(tab.label)} style={[styles.tabButton, active && { backgroundColor: cardBackground }]}>
                <MaterialIcons name={tab.icon} size={18} color={active ? '#cd2bee' : secondary} />
                <Text style={[styles.tabText, { color: active ? '#cd2bee' : secondary }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {commentsSeed.map((comment) => (
            <View key={comment.id} style={styles.commentBlock}>
              <View style={styles.commentRow}>
                <Image source={{ uri: comment.avatar }} style={styles.avatar} />
                <View style={styles.commentMain}>
                  <View style={styles.commentMetaRow}>
                    <View style={styles.commentNameRow}>
                      <Text style={[styles.commentHandle, { color: theme.text }]}>{comment.handle}</Text>
                      {comment.verified ? <MaterialIcons name="verified" size={14} color="#cd2bee" /> : null}
                    </View>
                    <Text style={[styles.commentTime, { color: muted }]}>{comment.time}</Text>
                  </View>
                  <Text style={[styles.commentBody, { color: commentText }]}>{comment.text}</Text>
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => setReplyingTo(comment.handle)} style={styles.metaAction}>
                      <MaterialIcons name="reply" size={14} color={muted} />
                      <Text style={[styles.metaActionText, { color: muted }]}>Reply</Text>
                    </Pressable>
                    <Pressable style={styles.metaAction}>
                      <MaterialIcons name="favorite" size={14} color={muted} />
                      <Text style={[styles.metaActionText, { color: muted }]}>{comment.likes}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {comment.reply ? (
                <View style={styles.replyWrap}>
                  <View style={[styles.replyLine, { backgroundColor: 'rgba(205,43,238,0.28)' }]} />
                  <View style={styles.replyRow}>
                    <Image source={{ uri: comment.reply.avatar }} style={styles.replyAvatar} />
                    <View style={styles.replyMain}>
                      <View style={styles.commentMetaRow}>
                        <Text style={[styles.replyHandle, { color: theme.text }]}>{comment.reply.handle}</Text>
                        <Text style={[styles.replyTime, { color: muted }]}>{comment.reply.time}</Text>
                      </View>
                      <Text style={[styles.replyBody, { color: commentText }]}>
                        <Text style={{ color: '#cd2bee', fontFamily: 'PlusJakartaSansBold' }}>{comment.handle} </Text>
                        {comment.reply.text}
                      </Text>
                      <View style={styles.replyActions}>
                        <Text style={[styles.replyActionText, { color: muted }]}>Reply</Text>
                        <Text style={[styles.replyActionText, { color: muted }]}>Like</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          ))}

          <BlurView intensity={32} tint={isDark ? 'dark' : 'light'} style={[styles.giftCard, { borderColor: 'rgba(205,43,238,0.18)' }]}>
            <Image source={{ uri: 'https://picsum.photos/seed/marcus-digital/120' }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <View style={styles.giftHeaderRow}>
                <Text style={[styles.commentHandle, { color: theme.text }]}>@marcus_digital</Text>
                <Text style={styles.giftLabel}>GIFTER</Text>
              </View>
              <View style={styles.giftMetaRow}>
                <MaterialIcons name="redeem" size={18} color="#cd2bee" />
                <Text style={[styles.giftText, { color: theme.text }]}>Sent a Hyper-Glow Gift</Text>
              </View>
            </View>
          </BlurView>
        </ScrollView>

        <View style={[styles.inputShell, { borderTopColor: softBorder, paddingBottom: Math.max(insets.bottom, 12) }]}>
          {replyingTo ? (
            <View style={[styles.replyingBanner, { backgroundColor: cardBackground, borderColor: softBorder }]}>
              <View style={styles.replyingInfo}>
                <MaterialIcons name="reply" size={16} color="#cd2bee" />
                <Text style={[styles.replyingText, { color: secondary }]}>
                  Replying to <Text style={{ color: theme.text, fontFamily: 'PlusJakartaSansBold' }}>{replyingTo}</Text>
                </Text>
              </View>
              <Pressable onPress={() => setReplyingTo(null)}>
                <MaterialIcons name="close" size={18} color={muted} />
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.inputRow, { backgroundColor: cardBackground, borderColor: softBorder }]}>
            <Pressable style={styles.inputIcon}>
              <MaterialIcons name="add-circle" size={22} color={secondary} />
            </Pressable>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Join the discussion..."
              placeholderTextColor={muted}
              style={[styles.input, { color: theme.text }]}
            />
            <Pressable style={styles.inputIcon}>
              <MaterialIcons name="mood" size={22} color={secondary} />
            </Pressable>
            <Pressable style={styles.sendButton}>
              <MaterialIcons name="send" size={18} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.homeIndicatorWrap}>
            <View style={[styles.homeIndicator, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)' }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalFrame: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000033',
  },
  bgImage: { width: '100%', height: '100%', opacity: 0.4 },
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(10), textTransform: 'uppercase', letterSpacing: 0.8 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  tabButton: { flex: 1, minHeight: 46, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabText: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 0.2 },
  content: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18, gap: 22 },
  commentBlock: { gap: 12 },
  commentRow: { flexDirection: 'row', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  commentMain: { flex: 1 },
  commentMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentHandle: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(10) },
  commentTime: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(7) },
  commentBody: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(9), lineHeight: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8 },
  metaAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaActionText: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(7) },
  replyWrap: { marginLeft: 34, paddingLeft: 18, position: 'relative', gap: 10 },
  replyLine: { position: 'absolute', left: 0, top: -6, bottom: 6, width: 2, borderRadius: 999 },
  replyRow: { flexDirection: 'row', gap: 10 },
  replyAvatar: { width: 32, height: 32, borderRadius: 16 },
  replyMain: { flex: 1 },
  replyHandle: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(8) },
  replyTime: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(6) },
  replyBody: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(8), lineHeight: 15 },
  replyActions: { flexDirection: 'row', gap: 16, marginTop: 6 },
  replyActionText: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(6) },
  giftCard: { flexDirection: 'row', gap: 12, borderRadius: 20, padding: 14, overflow: 'hidden', borderWidth: 1 },
  giftHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  giftLabel: { color: '#cd2bee', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(6), letterSpacing: 0.6, textTransform: 'uppercase' },
  giftMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  giftText: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(8) },
  inputShell: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
  replyingBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  replyingInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyingText: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(7) },
  inputRow: { minHeight: 52, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 4 },
  inputIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 39, fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(9) },
  sendButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#cd2bee' },
  homeIndicatorWrap: { alignItems: 'center', paddingTop: 10 },
  homeIndicator: { width: 128, height: 4, borderRadius: 999 },
});

export default Reactions;
