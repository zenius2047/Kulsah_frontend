import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeMode } from '../theme';
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';

const Notifications: React.FC = () => {
  const { isDark, theme } = useThemeMode();

  const shell = isDark ? '#0a050d' : theme.background;
  const card = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const textPrimary = isDark ? '#f7f5f8' : theme.text;
  const textMuted = isDark ? '#94a3b8' : theme.textSecondary;
  const sectionLabel = isDark ? '#64748b' : theme.textMuted;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: shell }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: shell }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: sectionLabel }]}>TODAY</Text>

            <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
              <View style={styles.hotBadgeWrap}>
                <Text style={styles.hotBadge}>HOT NOW</Text>
              </View>
              <View style={styles.rowStart}>
                <View style={styles.eventIconWrap}>
                  <MaterialIcons name="emoji-events" size={24} color="#ffffff" />
                </View>
                <View style={styles.flexOne}>
                  <Text style={[styles.titleText, { color: textPrimary }]}>
                    New Challenge Live: <Text style={styles.accentText}>Urban Beats</Text>
                  </Text>
                  <Text style={[styles.bodyText, { color: textMuted }]}>
                    The streets are calling. Show your best moves and climb the Arena.
                  </Text>
                  <Pressable style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>Join</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
              <View style={styles.rowBetween}>
                <View style={styles.rowStart}>
                  <Image
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoPdaH-0B-Kqt5PhkG-jZ4Xmb3ulH0TYtrlTYhLukxjbGK2tonsGP9wWPuy13aEOqNjEo7kGJ-HmoqKEngktWtLmtf1ZOwU_OeHqt7weQYV8C_F1PRtjKg-AY6Bc9tWnq6hN10qqWX-Ct2y-yEEUoTlHSpTKbIx91G13CGQ2-HewrKFQIiGu9b-aqujPnQuWKMeQjiWVfZCPE7FY-NB2w5QeqC4rWNxMSYbm49C5rYyxgH2ZQdgLazUu4I8y3E7-nJKFiZhBcVeT4N',
                    }}
                    style={[styles.avatar, { borderColor: border }]}
                  />
                  <View>
                    <Text style={[styles.inlineText, { color: textPrimary }]}>
                      <Text style={styles.strongText}>Luna.AI </Text>
                      <Text style={{ color: textMuted }}>liked your video</Text>
                    </Text>
                    <Text style={[styles.timeText, { color: sectionLabel }]}>2m ago</Text>
                  </View>
                </View>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-XVdF537pncEQjBHy3Hcf5kb_tbR1bbcdeWQ0OXDZOorwmkSjaEMQlDjw6VKelmQ4re9vpX0Okp4asmOuy5gUo7Opf8MWyvGkYSrqs_t1q6FZ0kIeXi0dyHGYXUuyDiOw1euuGMti64cqabSf03fYoYPL0k28POzCWxGs0RvYXKg4R35POrq1D3G1B-FpEt1i4dv_nQsnSeOUvF1oVAfrjq3priwfQp8PyKtewZ4EITahdPaHskkK3jH4EKxJbmuROs4TpgEyg2Zg',
                  }}
                  style={[styles.videoThumb, { borderColor: border }]}
                />
              </View>
            </View>

            <View
              style={[
                styles.card,
                styles.walletCard,
                { backgroundColor: card, borderColor: border },
              ]}
            >
              <View style={styles.walletIcon}>
                <MaterialIcons name="account-balance-wallet" size={20} color="#cd2bee" />
              </View>
              <View style={styles.flexOne}>
                <Text style={[styles.titleSmall, { color: textPrimary }]}>Payout processed</Text>
                <Text style={[styles.bodyText, { color: textMuted }]}>
                  Your weekly earnings of $142.50 have been sent.
                </Text>
                <Text style={[styles.timeText, { color: sectionLabel }]}>1h ago</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: sectionLabel }]}>EARLIER</Text>

            <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
              <View style={styles.rowStart}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5wV9IJv8ZkWVZsvSFaz95HUimvzeQqN5Kz8T2l8GsoCpiHFKzv_h6sNwozHXfOPbT4zJLXL-dfyTldFLtr2_BD5BliqGS_qR4Gv0jkDCVpaXA6oXx8gBqaeFx-zmcsAC_7-MOhMBP3GceV5gmhC98dK2pIBfXqUw1e782fniMb5dXn_yr-N7up9oJ3HNc41_itvf8ZTIx8xx9GICHag8h6XN5dOk1j0vO7hyxr8hPZSZ50OfYfn_XgmjvkKzMPOmbOpwgLEBM9sbD',
                  }}
                  style={[styles.avatar, { borderColor: border }]}
                />
                <View>
                  <Text style={[styles.inlineText, { color: textPrimary }]}>
                    <Text style={styles.strongText}>Alex.VFX </Text>
                    <Text style={{ color: textMuted }}>mentioned you in a comment</Text>
                  </Text>
                  <Text style={[styles.timeText, { color: sectionLabel }]}>5h ago</Text>
                </View>
              </View>
              <View style={[styles.quoteBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)' }]}>
                <Text style={[styles.quoteText, { color: textMuted }]}>
                  "The lighting in this frame is insane! How did you achieve that neon glow effect? @creative_user"
                </Text>
                <Pressable>
                  <Text style={styles.replyText}>Reply</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
              <View style={styles.rowBetween}>
                <View style={styles.rowStart}>
                  <Image
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmnrg-NcGH-Bniuga3vuqjjMTn3JpRsNIGTS-dpwP1AZQl_lL-HyduvY7gTASQiBmF1OCnGDzWtX5YjfgSmP0zZYyz2rIB-TGQgN6S7oK8h1r0hbj1yl7SjOg43R0oD3Y4GQPHZAYSKQ5Kw4BGH2d7QOnBDK7m8qR6nFlJRMZRHc9V3a4nSDaRNPSlNYtUK1gDLVclqmxMeJql0hkpPpdUspZnjeK88BgeNk1Qm_TsZpRrIo69WJyQZKKNZa3uMHAFQtEv7Odx1e6G',
                    }}
                    style={[styles.avatar, { borderColor: border }]}
                  />
                  <View>
                    <Text style={[styles.inlineText, { color: textPrimary }]}>
                      <Text style={styles.strongText}>Synth.Pop </Text>
                      <Text style={{ color: textMuted }}>started following you</Text>
                    </Text>
                    <Text style={[styles.timeText, { color: sectionLabel }]}>10h ago</Text>
                  </View>
                </View>
                <Pressable style={[styles.followButton, { borderColor: '#cd2bee' }]}>
                  <Text style={styles.followButtonText}>Follow Back</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 10 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    letterSpacing: 2,
    marginBottom: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  rowStart: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flexOne: { flex: 1 },
  hotBadgeWrap: { position: 'absolute', top: 10, right: 10, zIndex: 2 },
  hotBadge: {
    backgroundColor: 'rgba(205,43,238,0.2)',
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(6),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    letterSpacing: 1,
  },
  eventIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#cd2bee',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    marginBottom: 6,
    paddingRight: 70,
  },
  titleSmall: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    marginBottom: 4,
  },
  accentText: { color: '#cd2bee' },
  bodyText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(9),
    lineHeight: fontScale(13),
    marginBottom: 10,
  },
  inlineText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(9),
    marginBottom: 4,
  },
  strongText: { fontFamily: 'PlusJakartaSansBold' },
  timeText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(7),
    textTransform: 'uppercase',
  },
  joinButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#cd2bee',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: '#cd2bee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  joinButtonText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(7),
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  videoThumb: {
    width: 46,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
  },
  walletCard: { borderLeftWidth: 4, borderLeftColor: '#cd2bee' },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(205,43,238,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quoteBox: {
    marginTop: 12,
    marginLeft: 60,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quoteText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(8.5),
    fontStyle: 'italic',
    lineHeight: fontScale(13),
  },
  replyText: {
    marginTop: 8,
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(7),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  followButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: mediumScreen ? 12:10,
    paddingVertical: 8,
  },
  followButtonText: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(6.5):fontScale(4.5),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default Notifications;
