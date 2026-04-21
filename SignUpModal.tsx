import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useThemeMode } from './theme';

type SignUpModalProps = {
  visible: boolean;
  isGuest?: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
};

const SignUpModal: React.FC<SignUpModalProps> = ({
  visible,
  isGuest = true,
  onClose,
  onCreateAccount,
}) => {
  const { isDark, theme } = useThemeMode();

  return (
    <Modal
      visible={visible && isGuest}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </Pressable>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.06)',
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: theme.accentSoft,
                borderColor: 'rgba(217,21,210,0.18)',
              },
            ]}
          >
            <MaterialIcons name="stars" size={40} color={theme.accent} />
          </View>

          <View style={styles.copyBlock}>
            <Text style={[styles.title, { color: theme.text }]}>Join the Galaxy</Text>
            <Text style={[styles.description, { color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b' }]}>
              Sign up now to follow your favorite creators, subscribe to exclusive drops, and more!
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={onCreateAccount}>
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={[styles.secondaryButtonText, { color: isDark ? 'rgba(255,255,255,0.22)' : '#94a3b8' }]}>
                Maybe Later
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 40,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  copyBlock: {
    gap: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  secondaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2.6,
  },
});

export default SignUpModal;
