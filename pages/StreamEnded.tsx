import React from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { fontScale } from '../fonts';

const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBmaQN3OAWLDySOXQCRnphM1I4oP8vh_9TOy93A5xUQlcHn-OmwZKMUXoVARGtJlJv4QGOfZzVfwQw-6nQSlI3R8AgPkE_CUfmRY1RuYTEaZaQEmntiW4ub1BtgrG-5_1CXWJU9AYbfLJ1pXJ5P36o9x1vSRrlVuQGNevrNH79hYKvPGDMNOytyP9yx1xT9XL_64b-nN6esGCw7oSbboa36QxN0Xak-TOtPOg0Yo52Yls6EoSaFOLkIgm_dqt3qz6bilTTY6EOsNC2z';

const eventImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBhSLPBVKD1pLGJl6MlFXUtJEkG-4Q2Q5e0QGHphEdeB3U0hzm6PC3Azur7h80wh1_Qv8emqaRrOz3ZhbJT1FFj25usyJpr62unJmmAegQ7L-C0m86ItzsdVORhlJD0nDvqlCU3JcHCGMHz7jN3BibbQlbFpK2-ZKHjujNy7yWZTV5aM2Sn3iIdhYDbfz-PTG0o1tvbbUJHGx39ZiFhPa4qvzCl6zowrGe6-hjaBKgOlKNaIERWabrjvIatwHLyBdyIqwfIccLNlzsI';

const recommendations = [
  {
    title: 'Jaxen - Neon Nights',
    genre: 'Alternative Rock',
    plays: '12K',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAi6PPQnAIOR81lzqzFPnWXV8tGTZR_fBSOWNeMPIimTBdwOFk07SeR_8PVun6oMfRW-_05_Y5zIh5OTU8aZR-MedQXaAMPkDQ6RZlMbsjwU89lnun6bOcFt6fnEC19UqLciogUifSxO8uvzb0SciG5MxGozRZkrXdJGn-DSNAodVKco9T0_2UtLGd64c98mFFCA19yaFBC1ZVqJHnuKs-KKkhjmHLe9xf7Kc7yRFHdi6V8-k6yEskVJqdN4Slz0jzn2_gIPNSs1bdX',
  },
  {
    title: 'Mila V - Acoustic Sessions',
    genre: 'Indie Pop',
    plays: '8.4K',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCzQw4O219qoKYdpP-s63AAFfxx3Jb-LlcAjZGFZQdoXNeAdPPvXtjM3-Mr7FlVt1cH_jn6RWVJK6oiV8DZjEvdx3XyuHGIf9KACrySxlu_IcX2BVqRr4pwyXd8_z3Rg5kb8esFHIlL04hO0is8cWuhqC8W8faToJOxYv4s3V4diCLxLAbMlxyhv308QBeK9fK_PkcPobnb0yDCyxvp2POlu8LyFywfUvMbdnwlMMofYdsang5r3Pg5_rwOg00OT89xuKwskbwnQiqL',
  },
  {
    title: 'The Glitch - Live Mix',
    genre: 'Electronic',
    plays: '25K',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYtzyMHbv6cdm8CGZu04W5Q0yN6y6wEdnAu1WbabbEPX2sxjtDx9mi-bfDjz5Yd4CQi1KtaXYCYgxnhb8riabonO6TeZv3caRAYkLpwdqFLP6MO8FvKuQ2YiHssnhmFvu7S3lhByZW5cMiynHb-7dq6NOZRdi57NmPyc6umYk3knIve1ZOqzpfMRyfwGkl6VV-uU5e_u1Q3OCJVujNKDHwKJuttnmMQzP5hRQUylLywVucQJnmFe29wWg9ftX4Ra8qOY-JVEdSnJfn',
  },
];

const impactStats = [
  { label: 'Time Watched', value: '42 mins', icon: 'schedule' as const },
  { label: 'Gifts Sent', value: '5 Sparkles', icon: 'redeem' as const },
];

const StreamEnded: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={['#241129', '#1f1121', '#140916']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable style={styles.headerIcon}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Stream Ended</Text>
          <Pressable style={styles.headerIcon}>
            <MaterialIcons name="share" size={22} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroCard}>
            <Image source={{ uri: heroImage }} style={styles.heroImage} />
            <LinearGradient
              colors={['rgba(31,17,33,0)', 'rgba(31,17,33,0.2)', 'rgba(31,17,33,1)']}
              locations={[0, 0.45, 1]}
              style={styles.heroOverlay}
            />
            <View style={styles.recordedPill}>
              <Text style={styles.recordedPillText}>Recorded Live</Text>
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>Thanks for watching, Alex!</Text>
              <Text style={styles.heroSubtitle}>
                You and 12,403 others tuned in to see Luna Ray.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Your Impact</Text>
          <View style={styles.statsGrid}>
            {impactStats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <View style={styles.statTopRow}>
                  <MaterialIcons name={stat.icon} size={16} color="#c924eb" />
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitleSpaced}>Don't miss the next one</Text>
          <View style={styles.eventCard}>
            <Image source={{ uri: eventImage }} style={styles.eventImage} />
            <View style={styles.presaleBadge}>
              <Text style={styles.presaleBadgeText}>Fan Presale</Text>
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>Luna Ray: Midnight Echoes Tour</Text>
              <Text style={styles.eventDate}>Friday, Oct 20 • 8:00 PM</Text>
              <Text style={styles.eventVenue}>Madison Square Garden, NYC</Text>
              <Pressable style={styles.ticketButton}>
                <Text style={styles.ticketButtonText}>Get Tickets</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.sectionTitleSpaced}>Recommended for You</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendationsRow}
          >
            {recommendations.map((item) => (
              <View key={item.title} style={styles.recommendationCard}>
                <View style={styles.recommendationImageWrap}>
                  <Image source={{ uri: item.image }} style={styles.recommendationImage} />
                  <View style={styles.playCountBadge}>
                    <MaterialIcons name="play-arrow" size={14} color="#c924eb" />
                    <Text style={styles.playCountText}>{item.plays}</Text>
                  </View>
                </View>
                <Text style={styles.recommendationTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.recommendationGenre}>{item.genre}</Text>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.profileButton}>
            <Text style={styles.profileButtonText}>View Full Profile</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1f1121',
  },
  screen: {
    flex: 1,
    backgroundColor: '#1f1121',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: 'rgba(31,17,33,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(16),
  },
  scrollContent: {
    paddingBottom: 28,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 320,
    backgroundColor: '#2f1a33',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  recordedPill: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recordedPillText: {
    color: '#c924eb',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(11),
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTextWrap: {
    marginTop: 'auto',
    padding: 16,
  },
  heroTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(26),
    lineHeight: 34,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(15),
    marginTop: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(18),
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleSpaced: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(20),
    marginTop: 26,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2f1a33',
    borderWidth: 1,
    borderColor: 'rgba(201,36,235,0.2)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(14),
  },
  statValue: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(28),
  },
  eventCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2f1a33',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  eventImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  presaleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#c924eb',
  },
  presaleBadgeText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(18),
    lineHeight: 25,
  },
  eventDate: {
    color: '#c924eb',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(15),
    marginTop: 12,
  },
  eventVenue: {
    color: '#bf92c8',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(13),
    marginTop: 4,
  },
  ticketButton: {
    marginTop: 16,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#c924eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(14),
  },
  recommendationsRow: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 16,
  },
  recommendationCard: {
    width: 160,
  },
  recommendationImageWrap: {
    width: 160,
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#27272a',
  },
  recommendationImage: {
    width: '100%',
    height: '100%',
  },
  playCountBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  playCountText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
  },
  recommendationTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(13),
    marginTop: 10,
  },
  recommendationGenre: {
    color: '#bf92c8',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(10),
    marginTop: 4,
  },
  profileButton: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  profileButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(16),
  },
});

export default StreamEnded;
