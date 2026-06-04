import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR } from "../theme";
import { fontSize } from './typography';

type ShareFriend = {
  id: string;
  name: string;
  avatar: string;
  online?: boolean;
};

type SharePlatform = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  bg: string;
  color: string;
  border: string;
};

type ShareAction = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accent?: boolean;
  danger?: boolean;
};

type CreatorShareSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const shareFriends: ShareFriend[] = [
  { id: 'alex', name: 'Alex', avatar: 'https://picsum.photos/seed/alex-share/120', online: true },
  { id: 'sarah', name: 'Sarah', avatar: 'https://picsum.photos/seed/sarah-share/120' },
  { id: 'marcus', name: 'Marcus', avatar: 'https://picsum.photos/seed/marcus-share/120' },
  { id: 'elena', name: 'Elena', avatar: 'https://picsum.photos/seed/elena-share/120' },
  { id: 'jordan', name: 'Jordan', avatar: 'https://picsum.photos/seed/jordan-share/120' },
];

const sharePlatforms: SharePlatform[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'chat', bg: 'rgba(34,197,94,0.15)', color: '#4ade80', border: 'rgba(34,197,94,0.26)' },
  { id: 'instagram', label: 'Instagram', icon: 'photo-camera', bg: 'rgba(217,70,239,0.16)', color: '#f472b6', border: 'rgba(236,72,153,0.28)' },
  { id: 'facebook', label: 'Facebook', icon: 'groups', bg: 'rgba(24,119,242,0.14)', color: '#60a5fa', border: 'rgba(24,119,242,0.25)' },
  // { id: 'sms', label: 'SMS', icon: 'sms', bg: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: 'rgba(255,255,255,0.12)' },
  { id: 'copy', label: 'Copy Link', icon: 'link', bg: 'rgba(217,21,210,0.15)', color: '#d915d2', border: 'rgba(217,21,210,0.24)' },
];

const shareActions: ShareAction[] = [
  { id: 'save', label: 'Save Video', icon: 'download' },
  { id: 'duet', label: 'Duet', icon: 'auto-awesome-motion' },
  { id: 'stitch', label: 'Stitch', icon: 'movie-edit' },
  { id: 'favorites', label: 'Favorites', icon: 'grade', accent: true },
  { id: 'report', label: 'Report', icon: 'flag', danger: true },
  { id: 'notInterested', label: 'Not Interested', icon: 'heart-broken' },
];

const CreatorShareSheet: React.FC<CreatorShareSheetProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const panelBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.96)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
  const textPrimary = theme.text;
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : theme.textSecondary;
  const textMuted = isDark ? 'rgba(255,255,255,0.34)' : theme.textMuted;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.drawer,
            {
              backgroundColor: panelBg,
              borderColor: panelBorder,
              paddingBottom: Math.max(insets.bottom + 12, 28),
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)' }]} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>Send to Friends</Text>
                {/* <Text style={styles.sectionAccent}>Share the pulse</Text> */}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsRow}>
                {shareFriends.map((friend) => (
                  <Pressable key={friend.id} style={styles.friendCard}>
                    <View style={styles.friendAvatarWrap}>
                      <View style={styles.friendGradientRing}>
                        <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                      </View>
                      {friend.online ? <View style={styles.onlineDot} /> : null}
                    </View>
                    <Text style={[styles.friendName, { color: textSecondary }]}>{friend.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 16 }]}>
                Share to Platforms
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platformRow}>
                {sharePlatforms.map((platform) => (
                  <Pressable key={platform.id} style={styles.platformCard}>
                    <View
                      style={[
                        styles.platformIconWrap,
                        {
                          backgroundColor: platform.bg,
                          borderColor: platform.border,
                        },
                      ]}
                    >
                      <MaterialIcons name={platform.icon} size={28} color={platform.color} />
                    </View>
                    <Text style={[styles.platformLabel, { color: textSecondary }]}>{platform.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.section, { marginBottom: 6 }]}>
              <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 16 }]}>Actions</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.actionRow}
              >
                {shareActions.map((action) => {
                  const bg = action.accent
                    ? 'rgba(217,21,210,0.12)'
                    : cardBg;
                  const border = action.accent
                    ? 'rgba(217,21,210,0.2)'
                    : cardBorder;
                  const iconColor = action.accent
                    ? '#d915d2'
                    : action.danger
                      ? '#ff6b81'
                      : textSecondary;
                  const textColor = action.accent ? '#d915d2' : textSecondary;

                  return (
                    <Pressable
                      key={action.id}
                      style={[
                        styles.actionTile,
                        {
                          backgroundColor: bg,
                          borderColor: border,
                        },
                      ]}
                    >
                      <MaterialIcons name={action.icon} size={24} color={iconColor} />
                      <Text style={[styles.actionText, { color: textColor }]}>{action.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    maxHeight: '85%',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 6,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 999,
  },
  content: {
    // paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    paddingHorizontal: 16,

  },
  sectionAccent: {
    color: '#d915d2',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  friendsRow: {
    gap: 16,
    paddingVertical: 4,
    paddingHorizontal: 16
  },
  friendCard: {
    alignItems: 'center',
    gap: 8,
    minWidth: 72,
  },
  friendAvatarWrap: {
    position: 'relative',
  },
  friendGradientRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2,
    // backgroundColor: PRIMARY_COLOR,
  },
  friendAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    // borderWidth: 2,
    // borderColor: '#0a050d',
  },
  onlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0a050d',
  },
  friendName: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  platformRow: {
    gap: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  platformCard: {
    alignItems: 'center',
    gap: 8,
    minWidth: 72,
  },
  platformIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformLabel: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  actionRow: {
    gap: 12,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  actionTile: {
    width: 104,
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
    gap: 10,
  },
  actionText: {
    ...fontSize.b5,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default CreatorShareSheet;
