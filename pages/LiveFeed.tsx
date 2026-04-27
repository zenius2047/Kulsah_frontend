import React from 'react';
import { Dimensions, FlatList, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeMode } from '../theme';
import { fontScale } from '../fonts';

interface Creator {
  id: string;
  handle: string;
  avatar: string;
}

interface LiveCard {
  id: string;
  title: string;
  subtitle: string;
  host: string;
  hostAvatar: string;
  background: string;
  viewers: string;
  likes: string;
  shares: string;
}

const CREATORS: Creator[] = [
  {
    id: '1',
    handle: '@jax_vibe',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGUUvpbnJHLH2yAYycba74msPWTRnhv7eY5c-c3vfnoLP76AC7kk5smgARt5RqTPE6A70_i_Zc6ZGuduEG5cb1M-OLpeNHalGFl6LFnLvOcrwRgoGHmWyuNRmOlrrdSDiTOEXrLj6OHExcThPDqtzloEUiOP9EbAPeqrzm2kwDsLJTScMJULVPb9j-46_84ddWslcRfIUqepP7uEUkck-oQNDd7jV8kuMUd-o9g0DWsTeJyhs18k5kvDzc1IOrdhRpypHFknTDfATY',
  },
  {
    id: '2',
    handle: '@luna.art',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDME57q598ZsuY-Hl0kV9iD8di4BLbpV8FA941TIWb50qf8p8uqva8ALr6UUnkbvIW9JeDmqDZMUKm6qYBIRc_PQsTe5Bcy5OsVyB834pALm2In1qk_mlTc_o4qbyEyMxTRCpXiQkD86Y4pCwJiL4XkZoo11bbOZHt1elL2xPf3iHQqtMHmWL0YmTRff2tjlp1LwhlKaam9NTEP4lijKHCLFyCknemguEpIPjwjKGpaaAXmWdVTE_xf8LTolo-cvRYHVf6Ws2hudLS9',
  },
  {
    id: '3',
    handle: '@dj_pulse',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5vDLwhlVNvZm5NWJdbn_ethfAW6zOMnkRZYXsmMoTsUjjE1TbkiHIO82DuRV74JqUyCEXvwwNhHzK7GDV3UJqEo8FNOIM8ymoOK63TcVjwnmqff6uTwj_rR3d8dnljVjnlSb5ButBgfdkInSyvkoqzvy6Yik-lyF0vLy1P5-nOUm1bgg2Qpa18THUbM6JgIK1kT1SyxmHg92bwxciGtUiB1N133xRHSfVhLmPy5XWzFQaL6yGOjL6_JP7BByR5l_My4HmKQoRvkHX',
  },
  {
    id: '4',
    handle: '@neon_ki',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQuxwNtfIttjCkSej7kkIbye9ofatA0PFz-RwfkHrmgRUppahq9oKgFeL31Jcyhu4HoVjyOUHRlJ9WiEmu9TN12fWjqqD8TqzFpvbaazVOsjyvKM-RKgqNd_aWCpogYrdvQjTgma7wYt8x4M7nsT4WK1ojfsmPG-_XMDd80ZdxEbK3wadI7dC-zlkkIcVommk5mKuM9sZBu1LiuA6jR_GEJYsvHoFqweJa7Z4EgwNUxonArB2ucrv1xxDUit9mfjq4eykhJxaDTxa9',
  },
  {
    id: '5',
    handle: '@pixel.boy',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxf7k_LoN_3saluH3Dv8FZWk0NjBHNBuR2mEjGOrqNyirmn1xYmNdPnqXQbljJ27T25CVb61WhoAzhylM9cM-S8y5L0xfrbrQbPUOMZR7hfYQgdmlbxlNZ2o0-F9B2gimjxqCJvwPIcKMPBYnydDHifXUGQzJHI9FZC6fnwX2ek_-csZWXDDKpZDTpDcHTgAJ5cLJ1a_o0erc4OqcPXhZ-ENKRhLw3cyHyjc6SxCzJ62h4lSWDOz0dyoKUBnTz3rwTEOFLND4H_HXC',
  },
];

const LIVE_CARDS: LiveCard[] = [
  {
    id: '1',
    title: 'Jax Vibe',
    subtitle: 'Late Night Synth Sessions',
    host: 'Jax Vibe',
    hostAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzMt1t9ktdctuxyxjzE4qg-cwmCNuIkWWkoJ_YAMMycXSppvXqs6Gd7x7jjDrnYmGnxon5AiHf6KQYhQu8czjIwjN6i3_qx4RQ2WcgHXdQM6yZsRP8j3ZV2iHHyO5kqQ3JywhWKbi8oVpRzBkk5Fd8nR2AGslyQrMDoU12xb9rd2Q2HYuA_C2scKn3SvqKGpbHOvjbBQv2fAHp8wHx3qYe7Q3ApqiDU-aDCI52Rit_r5Nat6uBMi3I8Mek78Lw8XD-YGZ_Z7Dp6x76',
    background: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWFbjP_sxpdd4GfgqN9EveXOHviBX1FAOj--gOgEA32jLJFvqbjt5HFbXDD2A-eInh0mdQFFY_mJ2pdG_eFUAfVC4foCAMjO73euuUwXlznm9DfxVLm7fpQCkMxaw7Jnl3BDR9-2lMorOyuPAIeuAxZMD9lrWhk5xYqOMzbmTzi0yDJbpZom5h_SJXUGU_WNlw6dJlV9dTWgz8oG3bOg94xIcNNwAZNbCAy_6YHsAaiFD-Vbs6Ep-bzfmjesCI-98p3yvR885zHVCU',
    viewers: '14.2K',
    likes: '1.2K',
    shares: '452',
  },
  {
    id: '2',
    title: 'Luna Art',
    subtitle: 'Digital Painting Challenge',
    host: 'Luna Art',
    hostAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBah-FMJI3CsndGYvwStH67BnBdzg5wGfeR-5fLu2TReyIinbph2Z07Po3fUl9Mhww1EZLgFUx7hKvBpAyPz7g3kT2uSSIba1xpbhtUw4Y-wD4kMVwtZ4mMbf6qiW_mcOz1mocU85Cu0cCIWk0qNMeZ73nMcoHUIW3jE7qHniHu2HML17HiRLBQ6t7wraIyp2v5nLhiPEdFlanCoVTJhKg9H3pvHvDs1D4se9ZZr9sX6gCiRuWHMoLUUUfsIbT3hexYJwHLeug_Fi2l',
    background: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKfVGBTtWh5dH3fubvRegqq3-V3mC2RRO9kvRAdv7OfHlcnwRCd9PG_b1djBvd39C6DhmvVWHRmBcdvoe4iWYCCH7JUnagMrQaYpM4nBA5X2XLs7VBMJAPuV3HgxUlh2h6esPaAfApWIfnGjSLgUR_uuoo7VP3gpYxxKgTjSF-_f2-faN9URONof-GmdJFaQYKReT6kLMPvSMzcuHEhXfX9zr8ct8_vbJFRUv52P4BxFVLzb2FmTD8HCujuSM3n1LNSAkLWptHZdHb',
    viewers: '8.9K',
    likes: '4.5K',
    shares: '1.1K',
  },
];

const LiveFeed: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const viewportHeight = Dimensions.get('screen').height;
  const creatorStripHeight = viewportHeight * 0.13;

  const renderCreatorStrip = () => (
    <View style={{ height: creatorStripHeight, backgroundColor: theme.background}}>
      <FlatList
        data={CREATORS}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.creatorRow}
        renderItem={({ item: creator }) => (
          <View style={[styles.creatorItem]}>
            <LinearGradient
              colors={['#cd2bee', '#cd2bee']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.creatorRing}
            >
              <Image source={{ uri: creator.avatar }} style={styles.creatorAvatar} />
            </LinearGradient>
            <Text style={[styles.creatorHandle, { color: isDark ? '#cbd5e1' : theme.textSecondary }]}>{creator.handle}</Text>
          </View>
        )}
        ListHeaderComponent={<View style={styles.creatorSpacer} />}
        ListFooterComponent={<View style={styles.creatorSpacer} />}
      />
    </View>
  );

  const renderLiveCard = ({ item: card, index }: { item: LiveCard; index: number }) => {
    const cardHeight = index === 0 ? viewportHeight * 0.82: viewportHeight * 0.93;

    return (
      <View
        style={[
          styles.cardShell,
          {
            shadowColor: isDark ? '#000000' : '#0f172a',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
            height: cardHeight,
            backgroundColor: 'black'
          },
        ]}
      >
        <ImageBackground
          source={{ uri: card.background }}
          style={[styles.card, { height: '100%' }]}
          imageStyle={styles.cardImage}
        >
          <View style={styles.cardTint} />

          <View style={styles.topRow}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>JOIN</Text>
            </View>

            <View style={styles.viewerBadge}>
              <MaterialIcons name="visibility" size={14} color="#f8fafc" />
              <Text style={styles.viewerBadgeText}>{card.viewers}</Text>
            </View>
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.92)']}
            locations={[0.1, 0.45, 1]}
            style={styles.bottomOverlay}
          >
            <View style={styles.bottomContent}>
              <View style={styles.copyColumn}>
                <View style={styles.hostRow}>
                  <Image source={{ uri: card.hostAvatar }} style={styles.hostAvatar} />
                  <View style={styles.hostText}>
                    <Text style={styles.hostName}>{card.title}</Text>
                    <Text style={styles.hostSubtitle}>{card.subtitle}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionColumn}>
                <View style={styles.metricBlock}>
                  <Pressable style={styles.metricButton}>
                    <MaterialIcons name="favorite" size={22} color="#ffffff" />
                  </Pressable>
                  <Text style={styles.metricText}>{card.likes}</Text>
                </View>

                <View style={styles.metricBlock}>
                  <Pressable style={styles.metricButton}>
                    <MaterialIcons name="share" size={22} color="#ffffff" />
                  </Pressable>
                  <Text style={styles.metricText}>{card.shares}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  return (
    <SafeAreaView
    style={[styles.safeArea, { backgroundColor: theme.background }]} edges={[]}>
      <View style={[styles.screen, {
        backgroundColor: theme.background,
        paddingTop: viewportHeight * 0.05,
        height: viewportHeight
        

         }]}>
        <FlatList
        bounces={false}
          data={LIVE_CARDS}
          keyExtractor={(item) => item.id}
          renderItem={renderLiveCard}
          ListHeaderComponent={renderCreatorStrip}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          style={{
            backgroundColor: 'black'
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    // flex: 1,
  },
  screen: {
    // flex: 1,
    // height: '100%',
    // backgroundColor: 'blue'
  },
  content: {
    // paddingTop: 18,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: fontScale(6),
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  creatorRow: {
    paddingBottom: 6,
    gap: 16,
  },
  creatorSpacer: {
    width: 0,
  },
  creatorItem: {
    width: 84,
    alignItems: 'center',
  },
  creatorRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#cd2bee',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  creatorAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    borderWidth: 2,
    borderColor: '#120814',
  },
  creatorHandle: {
    marginTop: 10,
    fontSize: fontScale(7.5),
    fontFamily: 'PlusJakartaSansBold',
  },
  feedStack: {
    backgroundColor: 'black',
    gap: 0,
  },
  cardShell: {
    // borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  card: {
    width: '100%',
    justifyContent: 'space-between',
  },
  cardImage: {
    // borderRadius: 28,
  },
  cardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 2, 12, 0.16)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(215, 51, 87, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.22)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff7b87',
  },
  liveBadgeText: {
    color: '#ffdad6',
    fontSize: fontScale(7),
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: 2.2,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  viewerBadgeText: {
    color: '#f8fafc',
    fontSize: fontScale(7),
    fontFamily: 'PlusJakartaSansBold',
  },
  bottomOverlay: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: 88,
  },
  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  copyColumn: {
    flex: 1,
    maxWidth: '72%',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#cd2bee',
    marginRight: 12,
  },
  hostText: {
    flex: 1,
  },
  hostName: {
    color: '#ffffff',
    fontSize: fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  hostSubtitle: {
    color: '#d1d5db',
    fontSize: fontScale(7),
    fontFamily: 'PlusJakartaSansMedium',
    marginTop: 2,
  },
  joinButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#cd2bee',
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#cd2bee',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: fontScale(9),
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  actionColumn: {
    alignItems: 'center',
    gap: 18,
    paddingBottom: 2,
  },
  metricBlock: {
    alignItems: 'center',
    gap: 6,
  },
  metricButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  metricText: {
    color: '#ffffff',
    fontSize: fontScale(7.5),
    fontFamily: 'PlusJakartaSansBold',
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
    borderRadius: 34,
    borderWidth: 1,
    backgroundColor: 'rgba(10,5,13,0.88)',
  },
  navItem: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 22,
  },
  navItemActive: {
    backgroundColor: 'rgba(205,43,238,0.18)',
    shadowColor: '#cd2bee',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  navLabel: {
    marginTop: 4,
    fontSize: fontScale(6.5),
    fontFamily: 'PlusJakartaSansBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

export default LiveFeed;
