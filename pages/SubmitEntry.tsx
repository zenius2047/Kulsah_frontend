import React, { useState } from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

const previewImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDhFOftNzhs814shqXm7wsAjhpwgP6vdnALyuid0Wfz-EnNLz-62RACTh85zIywL8WoBz1HuyX-nfeEHJ-I6SrmLZJQvP9lXpMHO1vwvZVjYORCfTKexBTzDZounMgCXAAniKec20F8gMW3jJtkvU2f5DjjLu1GhLyMGomadglNeGEbriDqwCKQkMeBpc3obvTvhuG5cINCuKXP1i6v9u-fGTyWtwo7nGMa3Y9_NNvdnVt8z_U3NJsKZfECzDg6dyvdMqB9bOIfE77E';

const suggestedTags = ['#creator', '#trending', '#motion', '#afterhours'];

const SubmitEntry: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [hashtags, setHashtags] = useState(['#neonvibes', '#digitalart']);
  const [subscribersOnly, setSubscribersOnly] = useState(true);
  const [allowDuets, setAllowDuets] = useState(true);
  const [allowComments, setAllowComments] = useState(false);

  const cardBackground = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const subtleSurface = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const mutedText = isDark ? '#94a3b8' : theme.textSecondary;
  const softText = isDark ? '#64748b' : theme.textMuted;

  const removeHashtag = (tag: string) => {
    setHashtags((current) => current.filter((item) => item !== tag));
  };

  const addHashtag = (tag: string) => {
    if (!hashtags.includes(tag)) {
      setHashtags((current) => [...current, tag]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.82)',
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={22} color={theme.textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Create Pulse</Text>
        </View>

        {/* <Pressable style={styles.headerPostButton}>
          <Text style={styles.headerPostText}>Post</Text>
        </Pressable> */}
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewSection}>
          <View style={styles.previewCard}>
            <Image source={{ uri: previewImage }} style={styles.previewImage} />
            <View style={styles.previewShade} />
            <View style={styles.previewDuration}>
              <Text style={styles.previewDurationText}>00:15</Text>
            </View>
          </View>

          <View style={styles.formColumn}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: mutedText }]}>Title</Text>
              <TextInput
                placeholder="Add a catchy title..."
                placeholderTextColor={softText}
                style={[
                  styles.input,
                  { backgroundColor: subtleSurface, color: theme.text },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: mutedText }]}>Description</Text>
              <TextInput
                multiline
                placeholder="Tell your fans more about this Pulse..."
                placeholderTextColor={softText}
                style={[
                  styles.textArea,
                  { backgroundColor: subtleSurface, color: theme.text },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Hashtags</Text>
            <Text style={styles.sectionHint}>Suggested: 4</Text>
          </View>

          <View style={[styles.glassCard, { backgroundColor: cardBackground, borderColor: theme.border }]}>
            <View style={styles.tagWrap}>
              {hashtags.map((tag) => (
                <View key={tag} style={styles.activeTag}>
                  <Text style={styles.activeTagText}>{tag}</Text>
                  <Pressable onPress={() => removeHashtag(tag)}>
                    <MaterialIcons name="close" size={16} color="#930df2" />
                  </Pressable>
                </View>
              ))}

              <Pressable style={[styles.addTagButton, { backgroundColor: subtleSurface }]} onPress={() => addHashtag('#newtag')}>
                <MaterialIcons name="add" size={16} color={theme.textSecondary} />
                <Text style={[styles.addTagText, { color: theme.textSecondary }]}>Add Hashtag</Text>
              </Pressable>
            </View>

            <View style={[styles.suggestedRow, { borderTopColor: theme.border }]}>
              {suggestedTags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[styles.suggestedChip, { backgroundColor: subtleSurface }]}
                  onPress={() => addHashtag(tag)}
                >
                  <Text style={[styles.suggestedChipText, { color: mutedText }]}>{tag}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Permissions</Text>

          <View style={[styles.permissionsCard, { backgroundColor: cardBackground, borderColor: theme.border }]}>
            <PermissionRow
              icon="stars"
              title="Subscribers Only"
              subtitle="Only paid members can view this content"
              accent="#d915d2"
              enabled={subscribersOnly}
              onToggle={setSubscribersOnly}
              isDark={isDark}
              theme={theme}
            />
            <PermissionRow
              icon="layers"
              title="Allow Duets"
              subtitle="Let others collaborate with your video"
              accent="#930df2"
              enabled={allowDuets}
              onToggle={setAllowDuets}
              isDark={isDark}
              theme={theme}
            />
            <PermissionRow
              icon="forum"
              title="Allow Comments"
              subtitle="Open the floor for discussion"
              accent="#64748b"
              enabled={allowComments}
              onToggle={setAllowComments}
              isDark={isDark}
              theme={theme}
              isLast
            />
          </View>
        </View>

        <Pressable style={styles.advancedButton}>
          <Text style={[styles.advancedText, { color: softText }]}>Advanced Settings</Text>
          <MaterialIcons name="expand-more" size={16} color={softText} />
        </Pressable>

        <View style={styles.bottomCtaWrap}>
          <Pressable
          onPress={()=>{
            navigation.navigate('MainTabs', {
              screen: 'Home',
              params: { tabToRoute: 'challenges' },
            })
          }}
          style={styles.postVideoButton}>
            <Text style={styles.postVideoText}>POST VIDEO</Text>
            <MaterialIcons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

type PermissionRowProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  accent: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  isDark: boolean;
  theme: ReturnType<typeof useThemeMode>['theme'];
  isLast?: boolean;
};

const PermissionRow: React.FC<PermissionRowProps> = ({
  icon,
  title,
  subtitle,
  accent,
  enabled,
  onToggle,
  isDark,
  theme,
  isLast = false,
}) => (
  <View style={[styles.permissionRow, !isLast && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
    <View style={styles.permissionLeft}>
      <View
        style={[
          styles.permissionIcon,
          {
            backgroundColor: enabled ? `${accent}20` : isDark ? '#1f2937' : theme.surface,
            borderColor: enabled ? `${accent}30` : theme.border,
          },
        ]}
      >
        <MaterialIcons name={icon} size={20} color={enabled ? accent : theme.textSecondary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.permissionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.permissionSubtitle, { color: isDark ? '#6b7280' : theme.textMuted }]}>{subtitle}</Text>
      </View>
    </View>

    <Switch
      value={enabled}
      onValueChange={onToggle}
      trackColor={{ false: isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1', true: '#d915d2' }}
      thumbColor="#fff"
    />
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    height: 94,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingTop: 34,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(13),
  },
  headerPostButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  headerPostText: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
  },
  content: {
    paddingTop: 108,
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 28,
  },
  previewSection: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  previewCard: {
    width: 120,
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  previewDuration: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewDurationText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    letterSpacing: 0.7,
  },
  formColumn: {
    flex: 1,
    gap: 14,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    marginLeft: 4,
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
  },
  textArea: {
    minHeight: 92,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
  },
  section: {
    gap: 12,
  },
  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(15),
  },
  sectionHint: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  glassCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(147,13,242,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(147,13,242,0.3)',
  },
  activeTagText: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(13),
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addTagText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  suggestedRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    flexWrap: 'wrap',
  },
  suggestedChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  suggestedChipText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
  },
  permissionsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    gap: 14,
  },
  permissionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  permissionTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(11),
  },
  permissionSubtitle: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(11),
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  advancedText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomCtaWrap: {
    paddingTop: 8,
  },
  postVideoButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#d915d2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 8,
  },
  postVideoText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(12),
    letterSpacing: 1.1,
  },
});

export default SubmitEntry;
