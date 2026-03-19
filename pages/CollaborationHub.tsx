import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GoogleGenAI } from '@google/genai';

type CollabTab = 'discover' | 'incoming' | 'outgoing' | 'active';
type ProjectType = 'Public Feed Track' | 'Premium Locked Release' | 'Event' | 'Live Session' | 'All';

interface CreatorPartner {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  genres: string[];
  vibeMatch: number;
  status: 'available' | 'busy' | 'selective';
  bio: string;
}

interface CollabRequest {
  id: string;
  partner: string;
  handle: string;
  avatar: string;
  genres: string[];
  type: Exclude<ProjectType, 'All'>;
  title: string;
  message: string;
  split: string;
  date: string;
  status: 'pending' | 'accepted' | 'declined' | 'negotiating' | 'withdrawn';
  isIncoming?: boolean;
  isNew?: boolean;
  matchScore: number;
}

const CollaborationHub: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [activeTab, setActiveTab] = useState<CollabTab>('discover');
  const [vibeQuery, setVibeQuery] = useState('');
  const [incomingFilter, setIncomingFilter] = useState<ProjectType>('All');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [selectedPartner, setSelectedPartner] = useState<CreatorPartner | null>(null);
  const [proposalDraft, setProposalDraft] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [splitRatio, setSplitRatio] = useState(50);
  const [collabType, setCollabType] = useState<Exclude<ProjectType, 'All'>>('Public Feed Track');

  const [partners, setPartners] = useState<CreatorPartner[]>([
    { id: 'p1', name: 'Zion King', handle: '@zion_afro', avatar: 'https://picsum.photos/seed/zion/150', genres: ['Afrobeats', 'Soul'], vibeMatch: 94, status: 'available', bio: 'Afrobeats pioneer looking for global sounds.' },
    { id: 'p2', name: 'Elena Rose', handle: '@elena_r', avatar: 'https://picsum.photos/seed/elena/150', genres: ['Synthwave', 'Indie'], vibeMatch: 88, status: 'selective', bio: 'Ethereal vocals and analog synthesis.' },
    { id: 'p3', name: 'Luna Ray', handle: '@luna_ray', avatar: 'https://picsum.photos/seed/luna/150', genres: ['Pop', 'Electronic'], vibeMatch: 72, status: 'busy', bio: 'Vibrant pop productions for the galaxy.' },
  ]);

  const [requests, setRequests] = useState<CollabRequest[]>([
    { id: 'r1', partner: 'Amara', handle: '@amara_vocal', avatar: 'https://picsum.photos/seed/amara/100', genres: ['Afrobeats', 'R&B'], type: 'Event', title: 'Winter Solstice Live', message: 'Want to co-headline the Winter Solstice show in Berlin?', split: '50/50', date: '2h ago', status: 'pending', isIncoming: true, isNew: true, matchScore: 92 },
    { id: 'r2', partner: 'Echo Vibe', handle: '@echo_beats', avatar: 'https://picsum.photos/seed/echo/100', genres: ['Trap', 'Experimental'], type: 'Public Feed Track', title: 'Cosmic Bass (Edit)', message: 'Need your ethereal pads for the next drop.', split: '60/40', date: '1d ago', status: 'accepted', isIncoming: true, matchScore: 85 },
    { id: 'o1', partner: 'The Glitch', handle: '@glitch_ops', avatar: 'https://picsum.photos/seed/glitch/150', genres: ['Techno', 'House'], type: 'Live Session', title: 'Techno-Soul Improv', message: 'Adding soul vocals live could create a unique contrast.', split: '40/60', date: '5h ago', status: 'pending', isIncoming: false, matchScore: 65 },
  ]);

  useEffect(() => {
    const state = route.params as { tab?: CollabTab } | undefined;
    if (state?.tab) setActiveTab(state.tab);
  }, [route]);

  const incomingPendingCount = useMemo(
    () => requests.filter((r) => r.isIncoming && r.status === 'pending').length,
    [requests]
  );

  const handleAiVibeSearch = async () => {
    if (!vibeQuery.trim()) return;
    setIsAiSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze partner match for: "${vibeQuery}"`,
      });
      setPartners((prev) =>
        prev.map((p) => ({ ...p, vibeMatch: Math.min(100, p.vibeMatch + Math.floor(Math.random() * 5)) }))
      );
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleSendProposal = () => {
    if (!selectedPartner || !proposalDraft.trim() || !projectTitle.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      const req: CollabRequest = {
        id: `o-${Date.now()}`,
        partner: selectedPartner.name,
        handle: selectedPartner.handle,
        avatar: selectedPartner.avatar,
        genres: selectedPartner.genres,
        type: collabType,
        title: projectTitle,
        message: proposalDraft,
        split: `${splitRatio}/${100 - splitRatio}`,
        date: 'Just now',
        status: 'pending',
        isIncoming: false,
        matchScore: selectedPartner.vibeMatch,
      };
      setRequests((prev) => [req, ...prev]);
      setIsSending(false);
      setShowSuccess(true);
    }, 1000);
  };

  const updateRequestStatus = (id: string, status: CollabRequest['status']) => {
    setIsProcessingAction(id);
    setTimeout(() => {
      setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status, isNew: false } : req)));
      setIsProcessingAction(null);
    }, 800);
  };

  return (
    <View>
      <View>
        <Pressable onPress={() => navigation.navigate('/dashboard')}>
          <Text>arrow_back</Text>
        </Pressable>
        <Text>Collaboration Hub</Text>
      </View>

      <View>
        {(['discover', 'incoming', 'outgoing', 'active'] as CollabTab[]).map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)}>
            <Text>{tab}</Text>
            {tab === 'incoming' && incomingPendingCount > 0 && <Text>{incomingPendingCount}</Text>}
          </Pressable>
        ))}
      </View>

      {activeTab === 'discover' && (
        <View>
          <Text>Vibe Matchmaker</Text>
          <TextInput value={vibeQuery} onChangeText={setVibeQuery} placeholder="Describe your sonic vision..." />
          <Pressable onPress={handleAiVibeSearch} disabled={isAiSearching || !vibeQuery.trim()}>
            <Text>{isAiSearching ? 'Analyzing...' : 'auto_awesome'}</Text>
          </Pressable>
          {partners.map((p) => (
            <Pressable key={p.id} onPress={() => { setSelectedPartner(p); setShowSuccess(false); }}>
              <Image source={{ uri: p.avatar }} />
              <Text>{p.name}</Text>
              <Text>{p.genres.join(' / ')}</Text>
              <Text>{p.vibeMatch}% Match</Text>
            </Pressable>
          ))}
        </View>
      )}

      {activeTab === 'incoming' && (
        <View>
          <View>
            {(['All', 'Public Feed Track', 'Premium Locked Release', 'Event', 'Live Session'] as ProjectType[]).map((t) => (
              <Pressable key={t} onPress={() => setIncomingFilter(t)}>
                <Text>{t}</Text>
              </Pressable>
            ))}
          </View>
          {requests
            .filter((r) => r.isIncoming && (incomingFilter === 'All' || r.type === incomingFilter))
            .map((r) => (
              <View key={r.id}>
                <Text>{r.partner}</Text>
                <Text>{r.title}</Text>
                <Text>{r.message}</Text>
                <Text>
                  {r.split} - {r.status}
                </Text>
                {r.status === 'pending' && (
                  <View>
                    <Pressable disabled={isProcessingAction === r.id} onPress={() => updateRequestStatus(r.id, 'accepted')}>
                      <Text>Accept</Text>
                    </Pressable>
                    <Pressable disabled={isProcessingAction === r.id} onPress={() => updateRequestStatus(r.id, 'declined')}>
                      <Text>Decline</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
        </View>
      )}

      {activeTab === 'outgoing' && (
        <View>
          {requests
            .filter((r) => !r.isIncoming)
            .map((r) => (
              <View key={r.id}>
                <Text>{r.partner}</Text>
                <Text>{r.title}</Text>
                <Text>{r.status}</Text>
                {r.status !== 'accepted' && r.status !== 'withdrawn' && (
                  <Pressable disabled={isProcessingAction === r.id} onPress={() => updateRequestStatus(r.id, 'withdrawn')}>
                    <Text>Withdraw</Text>
                  </Pressable>
                )}
              </View>
            ))}
        </View>
      )}

      {activeTab === 'active' && (
        <View>
          <Text>Active Partnerships</Text>
          <Text>Partnerships appear here after acceptance by both parties.</Text>
        </View>
      )}

      {selectedPartner && (
        <View>
          {showSuccess ? (
            <View>
              <Text>Pitch Transmitted</Text>
              <Text>Proposal sent to {selectedPartner.name}</Text>
              <Pressable
                onPress={() => {
                  setSelectedPartner(null);
                  setShowSuccess(false);
                  setActiveTab('outgoing');
                }}
              >
                <Text>Track Connection</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Pressable disabled={isSending} onPress={() => setSelectedPartner(null)}>
                <Text>close</Text>
              </Pressable>
              <Text>Project Pitch: {selectedPartner.name}</Text>
              <View>
                {(['Public Feed Track', 'Premium Locked Release'] as Exclude<ProjectType, 'All'>[]).map((t) => (
                  <Pressable key={t} onPress={() => setCollabType(t)}>
                    <Text>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput value={projectTitle} onChangeText={setProjectTitle} placeholder="Project title" />
              <TextInput value={proposalDraft} onChangeText={setProposalDraft} placeholder="Describe the vision..." />
              <View>
                <Pressable onPress={() => setSplitRatio((v) => Math.max(0, v - 5))}>
                  <Text>-</Text>
                </Pressable>
                <Text>
                  YOU {splitRatio}% / {100 - splitRatio}% {selectedPartner.name.split(' ')[0]}
                </Text>
                <Pressable onPress={() => setSplitRatio((v) => Math.min(100, v + 5))}>
                  <Text>+</Text>
                </Pressable>
              </View>
              <Pressable onPress={handleSendProposal} disabled={isSending || !proposalDraft.trim() || !projectTitle.trim()}>
                <Text>{isSending ? 'Sending...' : 'Send Proposal'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default CollaborationHub;
