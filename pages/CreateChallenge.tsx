import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { mediumScreen } from '../types';
import { fontScale } from '../fonts';

const referenceMedia = [
  {
    id: 'ref-upload',
    type: 'upload' as const,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCFWL6mLAqJ4TXdBCFnBA508t5Q3s_05Fayf5LTxX2qbWALPRoi2E3wNR-3QCenXbNk1yXK6B52kkVzWf6L3mf2vvg5SCbWIO1nHJeplV9N05bVYm0zJAlFVx8qL5NlRZ8TL0hUyL7iknrBXapKP2uoe_XIEqSk-Gt49ZT3anUG6na76e8Ir_GynbLKrvRzx2xK9qhC1_RdC0-TrpfdR0PItcG_wY2e2Pdyf1Lk7MeoO9Dv-D-cP4Ir2Vg93c-pA296D55OyAfOSJ4B',
  },
  {
    id: 'ref-01',
    type: 'file' as const,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCHRXAF4vBbIUY8M2vPFK7m8c3pnUU3BnwXFgvzWiOalKpT6ICW_HIQvs7Ffa48yljlRx-Vbl5nghtz0F-k44ll5SUcCIC3oMChrEF8nUGWa1zBBnzyt8QLCx7wL1SPJD7MiuBjMxS1s32Ifsj3KKAF6yZPaBMbAxPH2vnUdloJYsUAhVEleRomUXaDtCqxt_PKL4hzZDIBzwmbPiHbrTgO_NcW1eB73CPVdvVahahJIIqyyOvRr8fqdkJ0XovSlRW3GUjgfp42hZam',
    label: 'REF_01.MP4',
  },
];

const invitedCreators = [
  {
    id: 'jax',
    handle: '@JAX_VIBE',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzq6Yf2TxiCfuMx_YlkYveC3HetpE0Slt7vdDJICY2kPwZVHcSimR8YMpQCBrcu_nof5ymEy5ZtcDH_Ngz118CK9JK1-Uo9ueurArbYOU_OfChJ-ECzuHd9QDQzdzid_ba9w_PU3d2aZPah6hk_pWaTxolRm7dmOsnT7UoZQFlshslr3WjOvl0vaBx4YbMDh5D-5pLySi18VKOln1UxPELxYjQ4mZw9a-uG5JEjHn0SLIjKxKULVfPZiUn8iqRmhhg5HEWlP7zDwvc',
  },
  {
    id: 'luna',
    handle: '@LUNA_F',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDGFOZv9dJgPxl6uIV22xMBOcqu1PcMyCMbPuPncZQJssAglrBzlFyg0-EJmE1sGB0kX2PnOE-qCQjij1knvYayHaiiCDuV60EPHk7UaLC8CbKuZwsrF9m5WJzWq0iVbZ4V094Xsa6zd3DoFntj_FW2n3mkmKEN07jxPTa_ATk-nx8TQEfHTh0jQuabRfDodREpfSUXJJoGuU-x8fQ8Bp8Q-Gw5PkDP5c1RmXUxqyRriLH12JBb-GR-mDnGkoCB_yhtj27oJjAx6e07',
  },
  {
    id: 'zed',
    handle: '@ZED_STORM',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6dcv2GXU4UyZGd_jVVbBuODM9DNAcsWhDN8qdluvU56PYEW_rWV1Lq0sFq2XTvsFzcKq-WimCZSsqF-vAg2U7CJhKMRn69c_LszWq7WzPUQvWwqTB_i9vC6uluh4CRc8k_rBofdbp88xLwkhDchsu15z2bv8Pd_xseITzStJuap9DTjv6Vw7clCLZaHs1YA44HFlrajhVnTOzNXLBuTJQA1RxyaRG88o0Q_nWXyQ2ciYWi66pfxbTnnue07adDIVlE-94_UYMeHbP',
  },
];

const CreateChallenge: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [challengeTitle, setChallengeTitle] = useState('');
  const [rules, setRules] = useState('');
  const [search, setSearch] = useState('');
  const [criteria, setCriteria] = useState<'vote' | 'likes'>('vote');
  const bgGradient = isDark
    ? ['#120617', '#0a050d', '#050207']
    : ['#f8fafc', '#eef2ff', '#f8fafc'];
  const headerBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.92)';
  const headerBorder = isDark ? 'rgba(255,255,255,0.04)' : theme.border;
  const headerButtonBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const muted = isDark ? '#64748b' : theme.textMuted;
  const placeholder = isDark ? '#64748b' : theme.textMuted;
  const titleTone = isDark ? '#f8fafc' : theme.text;
  const activeCriteriaBg = isDark ? 'rgba(205,43,238,0.1)' : theme.accentSoft;
  const inactiveBorder = isDark ? 'rgba(255,255,255,0.18)' : theme.border;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={bgGradient}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* <View style={styles.topGlowPrimary} pointerEvents="none" />
        <View style={styles.topGlowSecondary} pointerEvents="none" /> */}

        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
          <Pressable style={[styles.headerButton, { backgroundColor: headerButtonBg }]} onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={22} color="#8b5cf6" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: titleTone }]}>NEW CHALLENGE</Text>
          <Pressable style={[styles.headerButton, { }]}>
            {/* <MaterialIcons name="send" size={22} color="#8b5cf6" /> */}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <View style={[styles.glassCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={styles.label}>Challenge Title</Text>
              <TextInput
                value={challengeTitle}
                onChangeText={setChallengeTitle}
                placeholder="Enter an electric title..."
                placeholderTextColor={placeholder}
                style={[styles.titleInput, { color: titleTone }]}
              />
              <LinearGradient
                colors={['#9333ea', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.titleUnderline}
              />
            </View>

            <View style={[styles.glassCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.labelMuted, { color: subtle }]}>Rules & Guidelines</Text>
              <TextInput
                value={rules}
                onChangeText={setRules}
                placeholder="Define the game... No filters? Best lighting? 15 seconds max?"
                placeholderTextColor={placeholder}
                multiline
                textAlignVertical="top"
                style={[styles.rulesInput, { color: titleTone, backgroundColor: inputBg }]}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="movie" size={18} color="#a855f7" />
              <Text style={[styles.sectionTitle, { color: titleTone }]}>Reference Media</Text>
            </View>

            <View style={styles.mediaGrid}>
              {referenceMedia.map((item) => {
                if (item.type === 'upload') {
                  return (
                    <Pressable key={item.id} style={[styles.mediaCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <Image source={{ uri: item.image }} style={styles.mediaImage} />
                      <View style={[styles.mediaOverlaySoft, { backgroundColor: isDark ? 'rgba(10,5,13,0.42)' : 'rgba(15,23,42,0.2)' }]} />
                      <View style={styles.uploadContent}>
                        <MaterialIcons name="add-circle" size={34} color="#c084fc" />
                        <Text style={[styles.uploadLabel, { color: titleTone }]}>Upload Video</Text>
                      </View>
                    </Pressable>
                  );
                }

                return (
                  <Pressable key={item.id} style={[styles.mediaCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Image source={{ uri: item.image }} style={styles.mediaImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.86)']}
                      style={styles.mediaOverlay}
                    />
                    <View style={styles.mediaFooter}>
                      <Text style={[styles.mediaBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(15,23,42,0.2)' }]}>{item.label}</Text>
                      <Pressable style={styles.deleteButton}>
                        <MaterialIcons name="delete" size={18} color="#ff7c87" />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="emoji-events" size={18} color="#cd2bee" />
              <Text style={[styles.sectionTitle, { color: titleTone }]}>Winning Criteria</Text>
            </View>

            <View style={styles.criteriaRow}>
              <Pressable
                onPress={() => setCriteria('vote')}
                style={[
                  styles.criteriaCard,
                  { backgroundColor: cardBg },
                  criteria === 'vote' && styles.criteriaCardActive,
                  criteria === 'vote' && { backgroundColor: activeCriteriaBg },
                ]}
              >
                <View
                  style={[
                    styles.criteriaIconWrap,
                    { backgroundColor: inputBg },
                    criteria === 'vote' && styles.criteriaIconWrapActive,
                  ]}
                >
                  <MaterialIcons name="how-to-vote" size={24} color="#cd2bee" />
                </View>
                <Text style={[styles.criteriaTitle, { color: titleTone }]}>Community Vote</Text>
                <Text style={[styles.criteriaMeta, { color: subtle }]}>Judge by 1v1 battles</Text>
              </Pressable>

              <Pressable
                onPress={() => setCriteria('likes')}
                style={[
                  styles.criteriaCard,
                  { backgroundColor: cardBg },
                  criteria === 'likes' && styles.criteriaCardActive,
                  criteria === 'likes' && { backgroundColor: activeCriteriaBg },
                ]}
              >
                <View
                  style={[
                    styles.criteriaIconWrap,
                    { backgroundColor: inputBg },
                    criteria === 'likes' && styles.criteriaIconWrapActive,
                  ]}
                >
                  <MaterialIcons
                    name="favorite"
                    size={24}
                    color={criteria === 'likes' ? '#cd2bee' : '#94a3b8'}
                  />
                </View>
                <Text style={[styles.criteriaTitle, { color: titleTone }]}>Pure Likes</Text>
                <Text style={[styles.criteriaMeta, { color: subtle }]}>Most interactions win</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.inviteHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="group-add" size={18} color="#a855f7" />
                <Text style={[styles.sectionTitle, { color: titleTone }]}>Invite Creators</Text>
              </View>
              <Text style={styles.inviteCounter}>3/10 INVITED</Text>
            </View>

            <View style={[styles.searchCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <MaterialIcons name="search" size={20} color={subtle} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search handles or names..."
                placeholderTextColor={placeholder}
                style={[styles.searchInput, { color: titleTone }]}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.creatorsRow}
            >
              {invitedCreators.map((creator) => (
                <View key={creator.id} style={styles.creatorChip}>
                  <View style={styles.creatorAvatarWrap}>
                    <Image source={{ uri: creator.image }} style={styles.creatorAvatar} />
                    <Pressable style={styles.creatorRemoveButton}>
                      <MaterialIcons name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                  <Text style={[styles.creatorHandle, { color: titleTone }]}>{creator.handle}</Text>
                </View>
              ))}

              <View style={styles.creatorChip}>
                <Pressable style={[styles.addCreatorButton, { borderColor: inactiveBorder }]}>
                  <MaterialIcons name="person-add" size={24} color={subtle} />
                </Pressable>
                <Text style={[styles.browseLabel, { color: muted }]}>BROWSE</Text>
              </View>
            </ScrollView>
          </View>

          <View style={styles.footerAction}>
            <Pressable 
            onPress={()=>{
              if(criteria === 'vote'){
                navigation.navigate('RevenueSplit')
              }
              if(criteria === 'likes'){
                navigation.navigate('NoReward')
              }
            }}
            style={styles.launchButton}>
              <LinearGradient
                colors={['#7c3aed', '#d946ef']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.launchGradient}
              >
                <Text style={styles.launchButtonText}>Continue</Text>
              </LinearGradient>
            </Pressable>
            <Text style={styles.footerNote}>
              By launching, you agree to the Creator Terms & Kulsah Guidelines
            </Text>
          </View>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  topGlowPrimary: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(205,43,238,0.22)',
  },
  topGlowSecondary: {
    position: 'absolute',
    top: 120,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(205,43,238,0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 16:13,
    letterSpacing: 1.4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 14,
  },
  glassCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  label: {
    color: '#c084fc',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 12:8,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  labelMuted: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 12:8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  titleInput: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 20: 16,
    padding: 0,
  },
  titleUnderline: {
    height: 1,
    marginTop: 14,
  },
  rulesInput: {
    minHeight: 108,
    borderRadius: 18,
    // paddingHorizontal: 0,
    paddingVertical: 14,
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 18:14,
    lineHeight: 22,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 15:11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  mediaGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  mediaCard: {
    flex: 1,
    aspectRatio: 9 / 16,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
  },
  mediaImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  mediaOverlaySoft: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,5,13,0.42)',
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  uploadContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadLabel: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 14:10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  mediaFooter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 12,
  },
  mediaBadge: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  criteriaRow: {
    flexDirection: 'row',
    gap: 14,
  },
  criteriaCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  criteriaCardActive: {
    borderColor: '#cd2bee',
  },
  criteriaIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  criteriaIconWrapActive: {
    backgroundColor: 'rgba(205,43,238,0.2)',
    shadowColor: '#cd2bee',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 4,
  },
  criteriaTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 14:10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  criteriaMeta: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 14:10,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 6,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  inviteCounter: {
    color: '#c084fc',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen? 14:10,
    letterSpacing: 1.2,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    // height: 60,
  },
  searchInput: {
    // flex: 1,
    fontFamily: 'PlusJakartaSans',
    fontSize: mediumScreen?15:12,
    padding: 0,
    // textAlign: 'center'
    // lineHeight: 24,
  },
  creatorsRow: {
    gap: 16,
    paddingRight: 12,
  },
  creatorChip: {
    alignItems: 'center',
    gap: 8,
  },
  creatorAvatarWrap: {
    width: 70,
    height: 70,
  },
  creatorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#cd2bee',
  },
  creatorRemoveButton: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cd2bee',
  },
  creatorHandle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen? 14:10,
  },
  addCreatorButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
  },
  footerAction: {
    paddingTop: 8,
    gap: 14,
  },
  launchButton: {
    borderRadius: 38,
    overflow: 'hidden',
    shadowColor: '#cd2bee',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 7,
  },
  launchGradient: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchButtonText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(14) : fontScale(10),
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  footerNote: {
    color: '#64748b',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 14:10,
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 16,
  },
});

export default CreateChallenge;
