import React, { useState } from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

type FilterKey = 'Recents' | 'Videos' | 'Favourites' | 'WhatsApp';

type MediaItem = {
  id: string;
  image: string;
  duration: string;
};

const filters: FilterKey[] = ['Recents', 'Videos', 'Favourites', 'WhatsApp'];

const mediaItems: MediaItem[] = [
  {
    id: '1',
    duration: '0:15',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAHp0CoZgLGRW5_oxoGFQ6a_GRbIgbl6gzi-ubMQPZoMXGPwsYJc1sOX1iIdNfLwWylVagdoBH5YqzMt8c1Duh2g-3znYzdjqikZbkcAWj8SXpHW5aECHLrm9_SYaVGju_nEinXsPQfVLwe_VrYyp-9ksRU1C-Jyl9QY1qTODuoiPUvjQNLigbF-t7UYe_oDjpKFTdre9WCuMAZUIxGsDSKDmttvCdmPQK4ka6tC5RFie-LpVhRVOH4Pd5KU0sMgzGdgLBKZpvcWa99',
  },
  {
    id: '2',
    duration: '0:42',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBN_eEfOUlty909U5QmSaCaFodJKXHN5EF4hVnRv4lUhOU3RFNfyDSaF-HAr_AGd4ZmkI0YnuboXA_VJ4Dv49iF-ulICf5ONYbmXyYTxcTjKi5Z-6hn2WiSA7p6LFSqQ_8EoaW_neQA568hf_Sh-nbweHhGGtFP9DR3pBy2Vmqd2jZxCJkOwqomQrAF_5Ih1ZObJRSyZWVXSiMYHsUFuBd1Fu0h-AcAOLSHixYUenZRF1ldFHylSuPP2Z-XKpZ9hVPOo1964UHv1qUw',
  },
  {
    id: '3',
    duration: '1:04',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBX7VKVfbYc7lcWPaipdnQ8rpqqoMGV9IrvoxuqU-VLSIc5iV3yZJrcQ6L4NY8KCQxKx4vhz3bkV-web8mb_Hsicv_7tGcv6ZlZ8we4qJQOQZ9Z1p6vQwj_HBvjePrxQM6EIij_Cj9CDiybF7NILjQcvVmEZLeG1JTQ1LC61kfVX5-6lxJjvR2p03dLDrUwDG0RrwyeYo-wRmPxafdpOKXhSOBv5qNffMDim3yry_SDWU11NlbSYPRY5gge20b9zI_HhOPgl1OuPln7',
  },
  {
    id: '4',
    duration: '0:08',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6IR7iUj4L9_lYi-7hhIL7DHoZ-cfAcS4u2kQWJcjxm9HLCgNc0qNyIR0BGadsJu8IYiCvhqxQyMC2LtPYnoiqfU1ke-70j-othlQo4zGbJ96iluXDD3am9Ol4sG9PD2IOwqaYbu9OmKXOSYOtwdfPY7RsIjCr3a8vapHXToKaZXHEWIFvaK5mXHdeUJZ73MaWzYEmrU1ROYWUlwBkM1qG6Hw-B8ajPVnXw9s2GSYJJl2KCqTNnLa6pw3Wp__2v3fgLRryM5oXiOiM',
  },
  {
    id: '5',
    duration: '0:22',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDzzCNLTDvhg6b-j1SNWwgteqUQ8kjn5oW8tNlBR_iV0vFenpfPAcNuN03Hmt-c74g8TQHs1FtonsPOu_inUZefaA0X5hL0dRXAVBWQ12Udp6bgpwEO2xknP137wQ7KxoDHy4qGvtzbWrwom16LcPPIhjgr-1UHg54Q3dYchEZhu7tUs_ulFgIoQNEMQjPLAFoSBKwgyFAIoQpdSywi2fWvUA5hqLiAgGc7RaoPXr6Nm3MkjMc8Jb3Y2GSpeHiU4lFkg_Wob_DOn0xP',
  },
  {
    id: '6',
    duration: '0:55',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAdH2XYKjcdDdmQd_BYk6SYyn4V8jhCZFB1xDXOf-dDjnB04jrLmPeMuRTgUR66P1PQ0PSGNEBEO2x9gEcbRlAhhymLvhBGdiVcbFo0iIKiCKeJh3Kxq7xEFDAatoqyzxf-lwdxPn2kTi2pzmfxMEG3py-xoEUtuOex8gIL7DBFPgWDD8MUq6W5AHbUdfOIKDdJidUD1e72akFK4eVbsO_sQjTWH2TUWlxBNUxi3tRE5qXlw9fr9lnhZ09uJvg50ehN_Qt1qjjc3zca',
  },
  {
    id: '7',
    duration: '0:12',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCwgtXESfkbKHjm2kG7ykzSDbFD9M8e0IsNsG6RraA0VSnh1JBuoehNUigWSXZJ6eSnOwX0HOsZWRuOUxU9HkKcy96GFJF38JiG_JqbYtlcP1HCS4XzlYOJnMOnjM2bmdDpoXWILvMPuy9GITHJHismFUXxMes0JYRuTawU7d4wSCPbiVUFHjZahksLH9DrZXc9MzMiyU-tOjQYczk95q3CGZ9IiwaRGcGyrC-u23YCXzP9FJ48gVgOZR3LzIhopjGNmMVZ8T8KCAj5',
  },
  {
    id: '8',
    duration: '0:30',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuACeQocoZpXmv6O_EvQMlbVCG8ORwDZ5kdp593F11Axe1H8KQV25zv9qa2lub1FA78JQs-XF6VJ95pXnP1TbL16VdA-SvXNeeiglRatxEQCi308bkOLzBQpfl8_oiUjRPSgGjJZDB0YtJ6pcqXh1iCVkqL_KG8mWJbF_T3XA-HuSnwq8nVnjqbJb6HMnBXSb6tvNxMCRDxRuZlpJNeLtp_nXdCG-9RtyMKBSJ9E2VYjtTzzHG6gcUXP55q2WOaQOcoezMMYUXqsFkpX',
  },
  {
    id: '9',
    duration: '0:19',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB1cnWoT7yseRuGzCUNGnpMAfgID8Cr73H4k1Whml75jGgX2KGl0eivNZo10jfii3fE_3HoeU8XlcXX2CqnxZQQhzKmV4W1cCE7lPpjWRMCGGn1Vlss3Qlo5RET3Pp-JijVyU2ha4iIAo5A5VVpro3GKlojwnFbB5J9-3j-ZsrRFlaxpcGcUP3MvlpwYIhFYCNAFcZ3UB1DI_rna4NPxkDagiiQStZ1DRT5OrcgBonX6xEgAOCyWCy6-HEFp43CGFGEACmwdVSISsP9',
  },
];

const Library: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Videos');
  const [selectedId, setSelectedId] = useState<string>('2');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View
        style={[
          styles.backgroundGlow,
          {
            backgroundColor: isDark ? theme.background : '#f7efff',
          },
        ]}
      />

      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? 'rgba(10,5,13,0.8)' : 'rgba(255,255,255,0.86)',
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable
            style={[
              styles.headerIconButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface },
            ]}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="close" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Library</Text>
        </View>

        <Pressable
        onPress={()=>(
          navigation.navigate("EditSubmission")
        )}
        style={styles.selectButton}>
          <Text style={styles.selectButtonText}>Select</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterChip,
                  isActive
                    ? styles.filterChipActive
                    : {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface,
                        borderColor: theme.border,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? '#cd2bee' : theme.textSecondary },
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.grid}>
          {mediaItems.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.card,
                  {
                    borderColor: isSelected ? '#d915d2' : theme.border,
                    borderWidth: isSelected ? 2 : 1,
                    shadowColor: isSelected ? '#d915d2' : '#000',
                    shadowOpacity: isSelected ? 0.28 : 0.12,
                  },
                ]}
                onPress={() => setSelectedId(item.id)}
              >
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <View style={styles.cardOverlay} />

                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>

                {isSelected ? (
                  <View style={styles.selectedBadge}>
                    <MaterialIcons name="check" size={14} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.unselectedBadge} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(15),
  },
  selectButton: {
    backgroundColor: '#930df2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#930df2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
  },
  content: {
    paddingTop: 124,
    paddingBottom: 36,
    paddingHorizontal: 8,
  },
  filtersRow: {
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 16,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: 'rgba(147,13,242,0.2)',
    borderColor: 'rgba(147,13,242,0.3)',
  },
  filterChipText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
  },
  card: {
    width: '33.3333%',
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    padding: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: 12,
  },
  durationBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
  },
  selectedBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d915d2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});

export default Library;
