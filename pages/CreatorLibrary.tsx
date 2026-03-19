import React, { useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontSize } from '../fonts';
import VisibilityIcon from '../assets/icons/visibility-svg.svg';
import PaymentIcon from '../assets/icons/payments-svg.svg';

type ContentType = 'all' | 'public' | 'premium' | 'live' | 'draft';

type LibraryItem = {
  id: string;
  title: string;
  type: ContentType;
  date: string;
  img: string;
  description?: string;
  stats: { primary: string; revenue: string; retention: string };
};

const INITIAL_DATA: LibraryItem[] = [
  { id: '1', title: 'Summer Tour Highlights', type: 'public', date: 'Aug 24, 2024', img: 'https://picsum.photos/seed/vid1/700', description: 'Public drop with strong conversion.', stats: { primary: '1.2M', revenue: '$14,200', retention: '68%' } },
  { id: '2', title: 'Behind the Scenes: Ep 1', type: 'premium', date: 'Aug 22, 2024', img: 'https://picsum.photos/seed/vid2/700', description: 'Subscribers-only studio breakdown.', stats: { primary: '450k', revenue: '$4,100', retention: '84%' } },
  { id: '3', title: 'Studio Transmission #4', type: 'live', date: 'Aug 20, 2024', img: 'https://picsum.photos/seed/vid3/700', stats: { primary: 'Live recap', revenue: '$8,400', retention: '92%' } },
  { id: '4', title: 'Secret Project 24', type: 'draft', date: 'Just now', img: 'https://picsum.photos/seed/vid4/700', description: 'Pending final color grade.', stats: { primary: 'In review', revenue: '$0', retention: '0%' } },
];

const TRENDING = [
  { id: 's1', title: 'Neon Dreams', artist: 'Synthwave Kid', cover: 'https://picsum.photos/seed/s1/200', uses: 12400 },
  { id: 's2', title: 'Midnight City', artist: 'Urban Echo', cover: 'https://picsum.photos/seed/s2/200', uses: 8500 },
  { id: 's3', title: 'Lofi Morning', artist: 'Chill Beats', cover: 'https://picsum.photos/seed/s3/200', uses: 45200 },
];

export default function CreatorLibrary() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<ContentType>('all');
  const [search, setSearch] = useState('');
  const [audit, setAudit] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [menuItem, setMenuItem] = useState<LibraryItem | null>(null);
  const [detailItem, setDetailItem] = useState<LibraryItem | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const tabs: { id: ContentType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'public', label: 'Public' },
    { id: 'premium', label: 'Premium' },
    { id: 'live', label: 'Live' },
    { id: 'draft', label: 'Drafts' },
  ];

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        const matchesTab = activeTab === 'all' || i.type === activeTab;
        const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
      }),
    [activeTab, items, search],
  );

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error('Missing API key');
      const ai = new GoogleGenAI({ apiKey });
      const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Give a 1-sentence strategy for creator libraries with high premium engagement.',
      });
      setAudit((r as { text?: string }).text || 'Premium interest is high. Gate best-performing follow-up episodes for conversion.');
    } catch {
      setAudit('Public reach is strong. Convert top highlights into first-look premium drops.');
    } finally {
      setIsAuditing(false);
    }
  };
  const syncProtocol = (nextType: ContentType, id?: string) => {
    const target = id || detailItem?.id;
    if (!target) return;
    setIsConverting(true);
    setTimeout(() => {
      setItems((prev) => prev.map((item) => (item.id === target ? { ...item, type: nextType } : item)));
      setDetailItem((prev) => (prev && prev.id === target ? { ...prev, type: nextType } : prev));
      setIsConverting(false);
    }, 900);
  };

  const removeItem = (id: string) => {
    const item = items.find((x) => x.id === id);
    Alert.alert(
      'Confirm Action',
      item?.type === 'draft' ? 'Discard this draft permanently?' : 'Delete this transmission permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: item?.type === 'draft' ? 'Discard' : 'Delete',
          style: 'destructive',
          onPress: () => {
            setItems((prev) => prev.filter((x) => x.id !== id));
            setMenuItem(null);
            setDetailItem((prev) => (prev?.id === id ? null : prev));
          },
        },
      ],
    );
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.rowBetween}>
          <View style={s.row}>
            <Pressable style={s.iconBtn} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <Text style={s.title}>Media Library</Text>
          </View>
          <Pressable style={[s.iconBtn, {backgroundColor: '#1f1022bf', borderWidth: 1, borderColor: '#ffffff14'}]} onPress={() => navigation.navigate('UploadContent')}>
            <MaterialIcons name="add" size={22} color="#cd2bee" />
          </Pressable>
        </View>

        <View style={s.searchWrap}>
          <MaterialIcons name="search" size={18} color="#8f95af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={s.searchInput}
            placeholder="Search your productions..."
            placeholderTextColor="#94a3b8"
            
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {tabs.map((t) => (
            <Pressable key={t.id} onPress={() => setActiveTab(t.id)} style={s.tabBtn}>
              <Text style={[s.tabText, activeTab === t.id && s.tabTextActive]}>{t.label}</Text>
              {activeTab === t.id ? <View style={s.tabDot} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content}>
        {/* <View style={s.aiCard}>
          <Text style={s.aiTitle}>Cinematic Strategy</Text>
          <Text style={s.aiText}>{audit || 'Gemini is ready to audit your visual library for engagement potential.'}</Text>
          <Pressable style={s.auditBtn} onPress={runAudit} disabled={isAuditing}>
            {isAuditing ? <ActivityIndicator color="#cd2bee" /> : <Text style={s.auditBtnText}>Audit Content Value</Text>}
          </Pressable>
        </View> */}

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 16
        }}>
          <Text style={s.section}>Trending Sounds</Text>
          <Text style={{
            color: '#cd2bee',
            fontSize: 10,
            textTransform: 'uppercase',
            fontFamily: 'PlusJakartaSansExtraBold'
          }}>Explore All</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.trendingRow}>
          <View style={{
            width: 16
          }}/>
          {TRENDING.map((sound) => (
            <View key={sound.id} style={s.soundCard}>
              <View style={{
                width: 104,
                height: 104,
                borderRadius: 999,
                borderWidth: 2,
                borderColor: 'white',
                padding: 2,
                justifyContent: 'center',
                alignItems: 'center'
              }} >
                <Image source={{ uri: sound.cover }} style={s.soundImg} />
                <View style={{
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  bottom: 10,
                  left: 0,
                  right: 0,
                }}>
                  <View style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#00000099',
                  paddingVertical: 1.5,
                  paddingHorizontal: 3,
                  borderRadius: 999,
                  width: '50%',
                  // marginHorizontal: 20
                }}>
                  <Text style={s.soundMeta}>{(sound.uses / 1000).toFixed(1)}K USES</Text>
                </View>
                </View>
              </View>
              <Text style={s.soundTitle} numberOfLines={1}>{sound.title}</Text>
              <Text
              numberOfLines={2}
              style={{
                fontSize: 8,
                color: '#ffffff4d',
                fontFamily: 'PlusJakartaSansExtraBold',
                textTransform: 'uppercase',
                textAlign: 'center'
              }}>{sound.artist}</Text>
            </View>
          ))}
        <View style={{
            width: 16
          }}/>
        </ScrollView>
        <View style={{
          height: 20
        }}/>
        {filtered.map((item) => (
          <Pressable key={item.id} style={s.itemCard} onPress={() => setDetailItem(item)}>
            <Image source={{ uri: item.img }} style={s.itemImg} />
            <View style={{ flex: 1 }}>
              <View style={{
                // backgroundColor: 'blue',
                flexDirection: 'row',
                height: 17
              }}>
                <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Pressable onPress={() => setMenuItem(item)} style={s.smallBtn}>
                  <MaterialIcons name="more-vert" size={18} color="#8f95af" />
                </Pressable>
              </View>
              <View style={{
                flexDirection: 'row',
                gap: 10,
                marginTop: 5,
                // backgroundColor: 'red'
              }}>
                  <Text style={[s.itemMeta, {
                    color: 
                    item.type === 'public'? '#60a5fa' : 
                    item.type === 'premium' ? '#cd2bee' : 
                    item.type === 'live' ? '#4ade80': '#ffffff4d',
                    borderRadius: 4,
                    borderWidth: 1,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    fontSize: 8,
                    fontFamily: 'PlusJakartaSansBold',
                    borderColor: 
                    item.type === 'public' ? '#3b82f64d' : 
                    item.type === 'premium' ?'#e5e7eb' : 
                    item.type === 'live'? '#22c55e4d' : '#ffffff1a',
                    backgroundColor: 
                    item.type === 'public' ? '#3b82f60d':
                    item.type === 'live'? '#22c55e0d' : '#ffffff0d',
                    }]}>{item.type.toUpperCase()}</Text>
                <Text style={{
                  color: '#94a3b8',
                  fontFamily: 'PlusJakartaSansBold',
                  fontSize: 10,
                  textTransform: 'uppercase'
                }}>{item.date}</Text>
              </View>
              {item.type !== 'draft' && <View style={{
                flexDirection: 'row',
                marginTop: 5,
                gap: 10,
                
              }}>
                <View style={{
                  flexDirection: 'row',
                  // gap: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <VisibilityIcon fill='#ffffff4d' height={20} width={20}/>
                  <Text style={s.itemMeta}>  {item.stats.primary}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  // gap: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <PaymentIcon fill='#4ade8080' height={20} width={20}/>
                  <Text style={[s.itemMeta, {color: '#4ade80'}]}>  {item.stats.revenue}</Text>
                </View>
              </View>}
              {item.type === 'draft' && <Text style={{
                color: '#ffffff33',
                fontFamily: 'PlusJakartaSansExtraBold',
                fontSize: 10,
                fontStyle: 'italic',
                marginTop: 5,
              }}>
                Draft Protocol: Sync Pending
                </Text>}
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Modal transparent visible={!!menuItem} animationType="fade" onRequestClose={() => setMenuItem(null)}>
        <Pressable style={s.overlay} onPress={() => setMenuItem(null)}>
          {menuItem ? (
            <View style={s.menu}>
              <Pressable style={s.menuRow} onPress={() => { setDetailItem(menuItem); setMenuItem(null); }}><Text style={s.menuText}>View Analytics</Text></Pressable>
              {menuItem.type === 'public' ? <Pressable style={s.menuRow} onPress={() => { syncProtocol('premium', menuItem.id); setMenuItem(null); }}><Text style={s.menuText}>Move to Premium</Text></Pressable> : null}
              {menuItem.type === 'premium' ? <Pressable style={s.menuRow} onPress={() => { syncProtocol('public', menuItem.id); setMenuItem(null); }}><Text style={s.menuText}>Move to Public</Text></Pressable> : null}
              <Pressable style={s.menuRow} onPress={() => { setMenuItem(null); navigation.navigate('UploadContent', { editing: menuItem.id, item: menuItem }); }}><Text style={s.menuText}>Edit Details</Text></Pressable>
              <Pressable style={s.menuRow} onPress={() => removeItem(menuItem.id)}><Text style={s.deleteText}>{menuItem.type === 'draft' ? 'Discard Draft' : 'Delete Transmission'}</Text></Pressable>
            </View>
          ) : null}
        </Pressable>
      </Modal>

      <Modal transparent visible={!!detailItem} animationType="slide" onRequestClose={() => setDetailItem(null)}>
        <View style={s.drawerWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDetailItem(null)} />
          {detailItem ? (
            <View style={s.drawer}>
              <View style={s.rowBetween}>
                <Text style={s.drawerTitle}>Content Metrics</Text>
                <Pressable onPress={() => setDetailItem(null)} style={s.smallBtn}><MaterialIcons name="close" size={18} color="#fff" /></Pressable>
              </View>
              <Image source={{ uri: detailItem.img }} style={s.drawerImg} />
              <Text style={s.drawerMeta}>Revenue: {detailItem.stats.revenue}</Text>
              <Text style={s.drawerMeta}>Retention: {detailItem.stats.retention}</Text>
              <Text style={s.drawerMeta}>{detailItem.description || 'No description.'}</Text>
              <View style={s.row}>
                <Pressable style={[s.protocolBtn, detailItem.type === 'public' && s.protocolBtnActive]} onPress={() => syncProtocol('public')}><Text style={s.protocolText}>Public</Text></Pressable>
                <Pressable style={[s.protocolBtn, detailItem.type === 'premium' && s.protocolBtnActive]} onPress={() => syncProtocol('premium')}><Text style={s.protocolText}>Premium</Text></Pressable>
              </View>
              {isConverting ? <ActivityIndicator color="#cd2bee" /> : null}
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  header: { backgroundColor: '#1f1022bf', borderBottomWidth: 1, borderBottomColor: '#ffffff14', paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' ,paddingHorizontal: 16, },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',  },
  title: { color: '#fff', fontSize: 18, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' },
  searchWrap: { marginTop: 25, height: 48, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff1a', backgroundColor: '#ffffff0a', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8, marginHorizontal: 16 },
  searchInput: { flex: 1, color: '#94a3b8' },
  tabs: { gap: 14, paddingTop: 10, paddingBottom: 4,  paddingHorizontal: 16, },
  tabBtn: { alignItems: 'center', gap: 6, marginTop: 20 },
  tabText: { color: '#94a3b8', textTransform: 'uppercase', fontSize: 10, fontFamily: 'PlusJakartaSansExtraBold', letterSpacing: 2, },
  tabTextActive: { color: '#cd2bee' },
  tabDot: { width: '100%', height: 4, borderRadius: 999, backgroundColor: '#cd2bee' },
  content: {gap: 12, paddingBottom: 120 },
  aiCard: { borderRadius: 18, borderWidth: 1, borderColor: '#cd2bee3a', backgroundColor: '#cd2bee14', padding: 12, gap: 10 },
  aiTitle: { color: '#cd2bee', textTransform: 'uppercase', fontWeight: '900', fontSize: 10 },
  aiText: { color: '#d9dce9', fontStyle: 'italic', fontSize: 13 },
  auditBtn: { height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#cd2bee50', alignItems: 'center', justifyContent: 'center' },
  auditBtnText: { color: '#cd2bee', textTransform: 'uppercase', fontWeight: '900', fontSize: 10 },
  section: { color: '#fff', fontSize: 16, textTransform: 'uppercase', fontFamily: 'PlusJakartaSansExtraBold' },
  trendingRow: { gap: 20, },
  soundCard: { width: 104, alignItems: 'center',justifyContent: 'center',},
  soundImg: { width: '100%', height: '100%', borderRadius: 999 },
  soundTitle: { color: '#fff', fontSize: FontSize.eight, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' },
  soundMeta: { color: 'white', fontSize: 5, fontFamily: 'PlusJakartaSansBold' },
  itemCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffffff14',
    backgroundColor: '#1f1022bf',
    padding: 10, 
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
  },
  itemImg: { width: 68, height: 68, borderRadius: 12 },
  itemTitle: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', flex: 1, marginRight: 8, lineHeight: 10, fontSize: 12 },
  itemMeta: { color: '#8f95af', fontSize: 10, fontFamily: 'PlusJakartaSansBold', lineHeight: 12 },
  smallBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ffffff10', alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'center', paddingHorizontal: 20 },
  menu: { borderRadius: 14, backgroundColor: '#11151f', borderWidth: 1, borderColor: '#ffffff20', overflow: 'hidden' },
  menuRow: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ffffff14' },
  menuText: { color: '#fff', textTransform: 'uppercase', fontSize: 10, fontWeight: '900' },
  deleteText: { color: '#ef4444', textTransform: 'uppercase', fontSize: 10, fontWeight: '900' },
  drawerWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000b3' },
  drawer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#101522', borderWidth: 1, borderColor: '#ffffff20', padding: 14, gap: 10 },
  drawerTitle: { color: '#fff', textTransform: 'uppercase', fontWeight: '900', fontSize: 20 },
  drawerImg: { width: '100%', height: 180, borderRadius: 14 },
  drawerMeta: { color: '#c2c7da', fontSize: 12 },
  protocolBtn: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1, borderColor: '#ffffff1f', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff08' },
  protocolBtnActive: { borderColor: '#cd2bee80', backgroundColor: '#cd2bee' },
  protocolText: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontSize: 10 },
});
