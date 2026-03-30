import React from 'react';
import { useThemeMode } from '../theme';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontScale } from '../fonts';

const CreatePost: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={['#140b1d', '#0f0814', '#09040d']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color="#F8FAFC" />
          </Pressable>

          <Text style={styles.headerTitle}>Create Post</Text>

          <Pressable style={styles.postChip}>
            <Text style={styles.postChipText}>Post</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileRow}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp9Ba4zdXy7oEhPx7K9OdrHKSFmutf_fyYs4aBKKT4i6RQ59VgW7agsHL08tBX8xYfHBttRhfdwGLg11GDC6MldLiVb8essJ1L_jTSF9lfG3fOER9oVihIEEv3Nxdz--mweOFLYm6b3HySB8rgpG5G_KszFMfG9_MLDyNggOGo3Sm1H_Z1w56RqEwqE50NJYL3x2aXlNuqajvsO8VNflbbJA4y7HkwupkwKc4GX7AGsWcbfNCGtCrozg1JAe5GdJBiBwFuYKbpWJT5',
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.name}>Alex Rivera</Text>
              <Text style={styles.subtitle}>Posting to Community</Text>
            </View>
          </View>

          <TextInput
            multiline
            placeholder="What's happening in your world?"
            placeholderTextColor="#64748B"
            textAlignVertical="top"
            style={styles.input}
          />

          <View style={styles.uploadCard}>
            <View style={styles.uploadIconWrap}>
              <MaterialIcons name="cloud-upload" size={38} color="#d915d2" />
            </View>

            <Text style={styles.uploadTitle}>Upload Media</Text>
            <Text style={styles.uploadText}>
              Drag and drop or browse files for images and video
            </Text>

            <Pressable style={styles.browseButton}>
              <Text style={styles.browseButtonText}>Browse Files</Text>
            </Pressable>
          </View>

          <View style={styles.bottomActions}>
            <View style={styles.toolRow}>
              <Pressable style={styles.toolButton}>
                <MaterialIcons name="image" size={24} color="#d915d2" />
              </Pressable>
              <Pressable style={styles.toolButton}>
                <MaterialIcons name="videocam" size={24} color="#d915d2" />
              </Pressable>
              <Pressable style={styles.toolButton}>
                <MaterialIcons name="format-list-bulleted" size={24} color="#d915d2" />
              </Pressable>
              <Pressable style={[styles.toolButton, styles.toolButtonRight]}>
                <MaterialIcons name="sentiment-satisfied" size={24} color="#d915d2" />
              </Pressable>
            </View>

            <Pressable style={styles.publishButton}>
              <Text style={styles.publishButtonText}>Publish Post</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0814',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0f0814',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217,21,210,0.12)',
    backgroundColor: 'rgba(15,8,20,0.82)',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerTitle: {
    flex: 1,
    paddingHorizontal: 16,
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(18),
  },
  postChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(217,21,210,0.08)',
  },
  postChipText: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(16),
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(217,21,210,0.2)',
  },
  name: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(16),
  },
  subtitle: {
    color: 'rgba(217,21,210,0.75)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
    marginTop: 4,
  },
  input: {
    minHeight: 220,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(18),
    lineHeight: 28,
    backgroundColor: 'rgba(217,21,210,0.1)',
  },
  uploadCard: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(217,21,210,0.3)',
    backgroundColor: 'rgba(217,21,210,0.06)',
    paddingHorizontal: 24,
    paddingVertical: 36,
    marginBottom: 28,
  },
  uploadIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,21,210,0.12)',
    marginBottom: 16,
  },
  uploadTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(22),
    marginBottom: 8,
  },
  uploadText: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(14),
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 20,
  },
  browseButton: {
    minWidth: 140,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },
  browseButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
    textAlign: 'center',
  },
  bottomActions: {
    gap: 16,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolButtonRight: {
    marginLeft: 'auto',
  },
  publishButton: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  publishButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(18),
  },
});

export default CreatePost;
