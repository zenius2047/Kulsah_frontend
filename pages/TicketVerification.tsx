import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeMode, PRIMARY_COLOR } from '../theme';
import { useVerifyEventTicket } from '../src/hooks/events/useEventMutations';
import { fontSize } from './typography';

export default function TicketVerification() {
  const navigation = useNavigation<any>(); const { theme } = useThemeMode(); const verify = useVerifyEventTicket();
  const [ticketId, setTicketId] = useState(''); const [signature, setSignature] = useState(''); const [result, setResult] = useState<any>(null);
  const submit = () => Alert.alert('Consume ticket?', 'Verification may immediately mark this ticket as used.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Verify', style: 'destructive', onPress: async () => { try { const response = await verify.mutateAsync({ ticket_id: ticketId.trim(), signature: signature.trim() }); setResult(response.data.data); } catch { setResult(null); } } },
  ]);
  return <SafeAreaView style={[s.screen, { backgroundColor: theme.background }]}>
    <View style={s.header}><Pressable onPress={() => navigation.goBack()} style={[s.icon, { borderColor: theme.border }]}><MaterialIcons name="chevron-left" size={22} color={theme.text} /></Pressable><Text style={[s.title, { color: theme.text }]}>Verify Ticket</Text><View style={s.icon} /></View>
    <View style={s.body}><Text style={[s.warning, { color: theme.textSecondary }]}>Only submit trusted ticket data. The signature is sent exactly as entered and is never generated or modified by the app.</Text>
      <TextInput value={ticketId} onChangeText={setTicketId} autoCapitalize="characters" placeholder="Ticket ID" placeholderTextColor={theme.textMuted} style={[s.input, { color: theme.text, borderColor: theme.border }]} />
      <TextInput value={signature} onChangeText={setSignature} autoCapitalize="none" placeholder="Signature from QR payload" placeholderTextColor={theme.textMuted} style={[s.input, { color: theme.text, borderColor: theme.border }]} />
      {verify.isError ? <Text style={s.error}>{(verify.error as any)?.response?.data?.message || 'Verification failed. Check the ticket and try again.'}</Text> : null}
      {result ? <View style={[s.result, { borderColor: theme.border }]}><MaterialIcons name="verified" size={28} color="#22c55e" /><Text style={[s.resultTitle, { color: theme.text }]}>Ticket verified</Text><Text style={{ color: theme.textSecondary }}>{result.ticket_number || result.id} · {result.status}</Text></View> : null}
      <Pressable onPress={submit} disabled={!ticketId.trim() || !signature.trim() || verify.isPending} style={[s.button, { opacity: !ticketId.trim() || !signature.trim() || verify.isPending ? .5 : 1 }]}>{verify.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Verify and consume</Text>}</Pressable>
    </View>
  </SafeAreaView>;
}
const s = StyleSheet.create({ screen: { flex: 1 }, header: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }, icon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, title: { flex: 1, textAlign: 'center', ...fontSize.h1, lineHeight: fontSize.h1.lineHeight, textTransform: 'uppercase', letterSpacing: 2 }, body: { padding: 20, gap: 16 }, warning: { ...fontSize.b4, lineHeight: 21 }, input: { height: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, ...fontSize.b4 }, error: { color: '#ef4444', ...fontSize.b4 }, result: { padding: 18, borderWidth: 1, borderRadius: 18, alignItems: 'center', gap: 6 }, resultTitle: { ...fontSize.b3, textTransform: 'uppercase' }, button: { height: 56, borderRadius: 28, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#fff', ...fontSize.b4, textTransform: 'uppercase' } });
