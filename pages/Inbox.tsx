import React from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';
import { useNavigation } from '@react-navigation/native';

type Collaborator = {
  id: string;
  name: string;
  image: string;
  live?: boolean;
  gradient?: boolean;
};

type ChatItem = {
  id: string;
  name: string;
  message: string;
  time: string;
  avatar: string;
  unread?: boolean;
  vip?: boolean;
  muted?: boolean;
};

const collaborators: Collaborator[] = [
  {
    id: '1',
    name: 'Alex.vfx',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ3kOAqtjZVNbt2gpXx9Q7GVzTkm5eK34Y12W1Uv7Cq1IqPHI44rS4syKbpfkjqN1FfNnzssVnYF6ZA79R6DbFTdnlKe9fX-aXnnOxNBk6s1GR7ZJNamRLehscjcDJN6nEv3qUVzv3baKPpqXX4asTRnEhFKKMuq8E3UrO7sHHEcDAxbLalYg1VuZQz5oHwYRH9U2zvwl9pshrS00uAxRNXqBpDuPEEzUI8CtRitMlQ3fsvkj7kM-6FPC97CpnRA2edqQFeoPp4OFb',
    live: true,
    gradient: true,
  },
  {
    id: '2',
    name: 'Luna.ai',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB9mnadv5zMECTAQr72cPvDevkLedjhiUFLc8F7TZQ1XaKRXPTU3QAZIp-N-RWAsc1roCQeDMWH60PpIkVli4QnWdJYoGOFNBG_clkilOnf-k6zMap69CMeI4zDX9H-mmVvQnWfYkld_SFedB-txm17rv390rAPtpUB3_DgiXNTpk7uMPRrOxC8bpYDhpPQjbV0512bPBl9OPrC7u0LbbBLRfpSbAUquzvuFn7E01mzbOUHPO_prte4A57iz13ojnNPDJxKKND07YGD',
    live: true,
    gradient: true,
  },
  {
    id: '3',
    name: 'Zero_G',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBu5iVRxckRXdh3-EcXkb7WjGUz1VdhKbyMmuD2ctS4xS2qrjYSBAzPhDHEKsGykjUd3HY8XBFV1CPZUriIE3N9GtmwY4AMrLEfL-lkUn81UjebpERV5pWAkoGuOOzk56e-uCwnaKFK3k_cJ7ySKJiZWftPdrVim5G8Zw69QuwH6Et1r0j8ZmKkguo4_TU0HXD8rJIQ9HkhyKumh9LGZv-3SdkWTuzsnfNMxpsQfFcFjHfyZHkyYN78nJSQB-M8OFeXmdgPuUJKUzX0',
  },
  {
    id: '4',
    name: 'Synth.Pop',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBVx9e2dxvIoKtEmpMtmRAjfh6RqIJP6_eJ_7XAkvbOBPGBcLjTCV124X3dUD5InBjmqWmJYxOiKedaZQY_u6y-6vA-03nrDPlVYc-hnC1a9efLAwI5PtquEubtHsmZKaJTLgKiXiooKimaA8U54vLQPrh8wriTTUzW8CHsdYVZYRV_smkSgXIcenDu90MEENKg8wr4wVGKpZ6rdr90kKXPlxBCNg3lQ8hkmH6tNe48uh_roCJu5qu1Tt0g74LfUZkiI4KeOo0gIJWm',
  },
];

const chatList: ChatItem[] = [
  {
    id: 'c1',
    name: 'Jordan Blaze',
    message: "Hey! Did you check out the new collab brief I sent over? Let's talk...",
    time: '2m ago',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDhbE-XZ7J60OQVzf6YXdkVJ9cajM3REru-jNwWxM7-emuQm2xAFWMArYRDk_DGUEajEfSFqd0K9zv_LEY3Di5VQT-eezZkBIhCpAIkU8jdYa2Y3D2VXANPALLz6pw0pcIPH-9isqKVwuLjy3uhoB0P4VS6PNzim6_XXKNMBK8rk5vog8_vxNSaJhtL-0RLrSpm1Rbs5WcXHxHTZSST08KG-GgBGN_3Xu8zLletjCoQksvQmzv5ksyR8pz3chG5kQGU6fCPWfvVOe10',
    unread: true,
    vip: true,
  },
  {
    id: 'c2',
    name: 'Sarah Digital',
    message: 'The renders are looking incredible. Just a few tweaks on the lighting.',
    time: '1h ago',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD_7h9SdgeURGBCiLEa3UKseK6TPTt0hypeVp9r68B4Xtu8Bed4leNw-QSV2zMa7rcUp6IQBEgvcCVP2LhNGNZr8qJq-CCBZx1hLz1XSMHzPGBRkHOwHS8rl2He3HZ3VI_dn395jQKNOKOsVxXf2a0eAR5wHFHlTT_4pPTOIW0aPwjK-p7e_Nnca4kW3UEejhzxCXQn88tZVpbLBKu0daM2KiNL5Fqq6UEv0yThmGB0hcBfVOAXBWgIm_3wyDOFMApzbqTxUx3ZvMwn',
  },
  {
    id: 'c3',
    name: 'Pulse Team Collab',
    message: '@Marcus: Updated the project timeline in Notion.',
    time: '3h ago',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCzE8YjJg2QV1uS_eiT6Ohi17YgWilf_nJTzGvFmImvuljdMEzf3rwCZClmnzv4brGDacyG8pGMJ1iAcBtlND4oLzejNK-R1_k9GRgEKkZD2hCw-BVMRw6amVbAVjnxzYmiK-v2MwSFydgOLDz4jLxtT9NEFSkmQ8fUvxTKGe2H73VAFOY1WX9zKebZlsMi2xuJKOrWtJcAD6M-gUKm_DlOQatTcvT6gQTkmAbB8_khnOd4g1mlatHpbP22Eg00i4OlN47EELW3hT5d',
    unread: false,
  },
  {
    id: 'c4',
    name: 'User_8842',
    message: 'Great content! Keep it up!',
    time: 'Yesterday',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCsnQ1N__cIEc0FcNA1EYbtx3fS4Q6gOupRTrwAzd2Epl_wJKiuTz5c7HryO0K9Iy2el8ycXQoiVoOjdUHHUIlGbWDefgspFZNbWvXQfjHVndamj5xnSLqLZ3u2OO_ijuIZyGCWcpgNrx1Zqfht2BedWtWujCgLha3e9oem2_x5jxJy_wEzUayE70TIvaxyTlNTfQGnWJmaoIY6ywwz5b3c3Xw-bChr5VRmUAYeaLqb8No4vwYW4dbQMlDeoSPR2LTon05_S_tuUcIY',
    muted: true,
  },
];

const Inbox: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const shell = isDark ? '#0a050d' : theme.background;
  const card = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const subtle = isDark ? '#64748b' : theme.textMuted;
  const textSecondary = isDark ? '#94a3b8' : theme.textSecondary;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: shell }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: shell }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topUtilityRow}>
            <View style={styles.headerLeft}>
                          <View style={[styles.avatarWrap, { borderColor: '#D946EF' }]}>
                            <Image source={{ uri: 'https://picsum.photos/seed/mila/100' }} style={styles.avatar} />
                          </View>
                          <View>
                            <Text style={[styles.title, { color: theme.text }]}>INBOX</Text>
                            <Text style={styles.subtitle}>CREATOR PROTOCOL</Text>
                          </View>
                        </View>
            <Pressable
              onPress={()=>{
                navigation.navigate('Notification')
              }}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={[styles.notificationButton, { backgroundColor: card, borderColor: border }]}
            >
              <MaterialIcons name="notifications-none" size={22} color={theme.text} />
              <View style={styles.notificationBadge} />
            </Pressable>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: subtle }]}>COLLABORATORS</Text>
            <Pressable>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collabRow}>
            {collaborators.map((item) => (
              <View key={item.id} style={styles.collabItem}>
                <View style={[styles.collabAvatarWrap, item.gradient && styles.collabAvatarWrapGradient, { borderColor: border }]}>
                  <Image source={{ uri: item.image }} style={styles.collabAvatar} />
                  {item.live ? <View style={styles.liveDot} /> : null}
                </View>
                <Text style={[styles.collabName, { color: item.gradient ? '#e2e8f0' : textSecondary }]}>{item.name}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.searchRow, { backgroundColor: card, borderColor: border }]}>
            <MaterialIcons name="search" size={20} color={subtle} />
            <TextInput
              placeholder="Search creators, fans or collaborations..."
              placeholderTextColor={subtle}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: subtle, marginTop: 18, marginBottom: 14 }]}>DIRECT MESSAGES</Text>

          <View style={styles.chatList}>
            {chatList.map((chat) => (
              <Pressable
              onPress={()=>{
                navigation.navigate('Chat')
              }}
              key={chat.id} style={[styles.chatCard, { backgroundColor: card, borderColor: border }]}>
                <View style={styles.chatAvatarWrap}>
                  <Image source={{ uri: chat.avatar }} style={[styles.chatAvatar, chat.unread && styles.chatAvatarUnread]} />
                  {chat.vip ? <View style={styles.vipBadge}><Text style={styles.vipText}>VIP</Text></View> : null}
                </View>
                <View style={styles.chatBody}>
                  <View style={styles.chatTopRow}>
                    <View style={styles.chatNameRow}>
                      <Text style={[styles.chatName, { color: chat.muted ? textSecondary : theme.text }]}>{chat.name}</Text>
                      {chat.unread ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={[styles.chatTime, { color: chat.unread ? '#d915d2' : subtle }]}>{chat.time}</Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.chatMessage, { color: chat.unread ? theme.text : textSecondary }]}>
                    {chat.message}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* <Pressable style={styles.fab}>
          <MaterialIcons name="edit" size={28} color="#fff" />
        </Pressable> */}

        <View style={[styles.bottomNav, { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : theme.card, borderColor: border }]}>
          <MaterialIcons name="home" size={24} color={subtle} />
          <MaterialIcons name="explore" size={24} color={subtle} />
          <MaterialIcons name="add-circle" size={38} color="#930df2" />
          <MaterialIcons name="mail" size={24} color="#d915d2" />
          <MaterialIcons name="person" size={24} color={subtle} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  topUtilityRow: { alignItems: 'flex-end', marginTop: 8, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d915d2',
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), letterSpacing: 2 },
  seeAll: { color: '#d915d2', fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(8), textTransform: 'uppercase' },
  collabRow: { gap: 14, paddingBottom: 6 },
  collabItem: { alignItems: 'center', width: 74, gap: 6,},
  collabAvatarWrap: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, padding: 2, },
  collabAvatarWrapGradient: { borderColor: '#930df2' },
  collabAvatar: { width: '100%', height: '100%', borderRadius: 30 },
  liveDot: { position: 'absolute', right: 2, bottom: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#0a050d' },
  collabName: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(7), textTransform: 'uppercase' },
  searchRow: { marginTop: 12, minHeight: 52, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(10) },
  chatList: { gap: 10 },
  chatCard: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatAvatarWrap: { width: 56, height: 56, position: 'relative' },
  chatAvatar: { width: '100%', height: '100%', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatAvatarUnread: { borderColor: '#d915d2', borderWidth: 2 },
  vipBadge: { position: 'absolute', bottom: -2, right: -2, borderRadius: 8, backgroundColor: '#d915d2', paddingHorizontal: 4, paddingVertical: 1 },
  vipText: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(6) },
  chatBody: { flex: 1 },
  chatTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  chatNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  chatName: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(10) },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d915d2' },
  chatTime: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(7), textTransform: 'uppercase' },
  chatMessage: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(9) },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#D946EF',
    overflow: 'hidden',
  },
  title: {
      color: '#F8FAFC',
      fontSize: mediumScreen ? 21:18,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
  avatar: {
    width: '100%',
    height: '100%',
  },
    subtitle: {
      color: '#D946EF',
      fontSize: mediumScreen ? 12:8,
      fontWeight: '900',
      letterSpacing: 2.5,
      marginTop: 2,
    },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 88,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#930df2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
});

export default Inbox;
