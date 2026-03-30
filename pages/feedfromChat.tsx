// 1) Remove deprecated fullscreen prop from VideoView
// 2) Force each item to exact viewport height
// 3) Add smoother vertical snapping behavior

import React, { useMemo, useState } from "react";
import { useThemeMode } from '../theme';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { fontScale } from '../fonts';


interface FeedItem {
  id: string;
  artist: string;
  handle: string;
  avatar: string;
  caption: string;
  video: string;
  likes: string;
  comments: string;
  isLiked: boolean;
  isSubscribed: boolean;
  isPremium: boolean;
  ticketsAvailable: boolean;
  ticketLocation?: string;
}

const VideoFeedItem: React.FC<{
  item: FeedItem;
  viewportHeight: number;
  onSubscribe: (id: string) => void;
  isGlobalMuted: boolean;
  onToggleMute: () => void;
}> = ({ item, viewportHeight, onSubscribe, isGlobalMuted, onToggleMute }) => {
  const navigation = useNavigation<any>();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(item.isLiked);
  

  const player = useVideoPlayer(item.video, (p) => {
    p.loop = true;
    p.muted = isGlobalMuted;
    p.play();
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  React.useEffect(() => {
    player.muted = isGlobalMuted;
  }, [isGlobalMuted, player]);

  const togglePlayPause = () => {
    if (isPlaying) player.pause();
    else player.play();
  };

  return (
    <View style={{ height: viewportHeight, backgroundColor: "#000" }}>
      <Pressable onPress={togglePlayPause} style={StyleSheet.absoluteFillObject}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          allowsPictureInPicture={false}
          // allowsFullscreen / allowFullscreen removed (deprecated)
        />
      </Pressable>

      <View style={styles.overlayTopRight}>
        <Pressable onPress={onToggleMute} style={styles.circleBtn}>
          <MaterialIcons
            name={isGlobalMuted ? "volume-off" : "volume-up"}
            size={22}
            color="white"
          />
        </Pressable>
      </View>

      <View style={styles.rightRail}>
        <Pressable onPress={() => {}}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        </Pressable>

        {!item.isSubscribed && (
          <Pressable onPress={() => onSubscribe(item.id)} style={styles.addBtn}>
            <MaterialIcons name="add" size={18} color="white" />
          </Pressable>
        )}

        <Pressable onPress={() => setIsLiked((v) => !v)} style={styles.railAction}>
          <MaterialIcons
            name={isLiked ? "favorite" : "favorite-border"}
            size={28}
            color={isLiked ? "#22c55e" : "white"}
          />
          <Text style={styles.railText}>{item.likes}</Text>
        </Pressable>

        <Pressable onPress={() => setShowComments(true)} style={styles.railAction}>
          <MaterialIcons name="chat-bubble-outline" size={26} color="white" />
          <Text style={styles.railText}>{item.comments}</Text>
        </Pressable>

        <Pressable style={styles.railAction} onPress={() => navigation.navigate("Video")}>
          <MaterialIcons name="share" size={25} color="white" />
          <Text style={styles.railText}>Share</Text>
        </Pressable>
      </View>

      <View style={styles.bottomMeta}>
        <View style={styles.handleRow}>
          <Text style={styles.handleText}>@{item.handle}</Text>
          {item.isPremium && (
            <View style={styles.premiumPill}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>

        <Text style={styles.caption}>{item.caption}</Text>

        {item.ticketsAvailable && (
          <Pressable style={styles.ticketBtn} onPress={() => navigation.navigate("Video")}>
            <Text style={styles.ticketText}>Tickets • {item.ticketLocation || "Available"}</Text>
          </Pressable>
        )}
      </View>

      <Modal
        visible={showComments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowComments(false)}>
          <Pressable style={styles.commentSheet}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentHeaderText}>{item.comments} Comments</Text>
              <Pressable onPress={() => setShowComments(false)}>
                <MaterialIcons name="close" size={22} color="white" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 340 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.commentItem}>
                  <Image
                    source={{ uri: `https://picsum.photos/seed/fan${i}/100` }}
                    style={styles.commentAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUser}>GalaxyFan_{i}</Text>
                    <Text style={styles.commentBody}>This visual is absolute fire!</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput
                placeholder="Add a comment..."
                placeholderTextColor="#94a3b8"
                style={styles.commentInput}
              />
              <Pressable>
                <Text style={styles.commentPost}>Post</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const Feed: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const { height: viewportHeight } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<"following" | "foryou">("foryou");
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);

  const [items, setItems] = useState<FeedItem[]>([
    {
      id: "1",
      artist: "Elena Rose",
      handle: "elena_rose",
      avatar: "https://picsum.photos/seed/elena/150/150",
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers.",
      video:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      likes: "2.4M",
      comments: "88.1K",
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: "London, UK",
    },
    {
      id: "2",
      artist: "Zion King",
      handle: "zionking_afro",
      avatar: "https://picsum.photos/seed/zion/150/150",
      caption: "Live from the main stage!",
      video:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      likes: "1.2M",
      comments: "45.8K",
      isLiked: true,
      isSubscribed: false,
      isPremium: false,
      ticketsAvailable: false,
    },
  ]);

  const displayedItems = useMemo(() => {
    if (activeTab === "following") return items.filter((i) => i.isSubscribed);
    return items;
  }, [activeTab, items]);

  const handleSubscribe = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSubscribed: true } : item))
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <StatusBar backgroundColor="transparent" translucent />

      <View style={styles.topBar}>
        <Pressable style={styles.topCircle} onPress={() => navigation.navigate("Discover")}>
          <MaterialIcons name="search" size={24} color="white" />
        </Pressable>

        <View style={styles.tabWrap}>
          <Pressable onPress={() => setActiveTab("following")} style={styles.tabBtn}>
            <View style={[styles.tabPill, activeTab === "following" && styles.tabPillActive]}>
              <Text style={[styles.tabText, activeTab === "following" && styles.tabTextActive]}>
                FOLLOWING
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={() => setActiveTab("foryou")} style={styles.tabBtn}>
            <View style={[styles.tabPill, activeTab === "foryou" && styles.tabPillActive]}>
              <Text style={[styles.tabText, activeTab === "foryou" && styles.tabTextActive]}>
                FOR YOU
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={displayedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoFeedItem
            item={item}
            viewportHeight={viewportHeight}
            onSubscribe={handleSubscribe}
            isGlobalMuted={isGlobalMuted}
            onToggleMute={() => setIsGlobalMuted((v) => !v)}
          />
        )}
        pagingEnabled
        snapToInterval={viewportHeight}
        snapToAlignment="start"
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
        disableIntervalMomentum
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        getItemLayout={(_, index) => ({
          length: viewportHeight,
          offset: viewportHeight * index,
          index,
        })}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  video: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlayTopRight: { position: "absolute", top: 86, right: 16 },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  rightRail: { position: "absolute", right: 14, bottom: 90, alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: "white" },
  addBtn: {
    marginTop: -10,
    marginBottom: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  railAction: { marginTop: 16, alignItems: "center" },
  railText: { color: "white", fontSize: fontScale(12), fontWeight: "700", marginTop: 4 },
  bottomMeta: { position: "absolute", left: 14, right: 80, bottom: 56 },
  handleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  handleText: { color: "white", fontWeight: "800", fontSize: fontScale(14) },
  premiumPill: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(0,0,0,0.32)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  premiumText: { color: "#22c55e", fontSize: fontScale(9), fontWeight: "800" },
  caption: { color: "white", marginTop: 8, fontSize: fontScale(13), fontWeight: "600", lineHeight: 18 },
  ticketBtn: {
    marginTop: 10,
    backgroundColor: "#22c55e",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ticketText: { color: "black", fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  commentSheet: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    maxHeight: "70%",
  },
  commentHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  commentHeaderText: { color: "white", fontWeight: "700", fontSize: fontScale(16) },
  commentItem: { flexDirection: "row", marginBottom: 14 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentUser: { color: "white", fontWeight: "700" },
  commentBody: { color: "#cbd5e1" },
  commentInputRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  commentInput: {
    flex: 1,
    backgroundColor: "#1f2937",
    color: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentPost: { color: "#22c55e", fontWeight: "700", marginLeft: 10 },
  topBar: {
    position: "absolute",
    top: 54,
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "76%",
  },
  topCircle: {
    borderColor: "rgba(255,255,255,0.35)",
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 999,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  tabWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 999,
    borderColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
    height: 44,
    width: "70%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tabBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  tabPill: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  tabPillActive: { backgroundColor: "rgba(255,255,255,0.22)" },
  tabText: { color: "#94a3b8", fontSize: fontScale(11), fontWeight: "800" },
  tabTextActive: { color: "white" },
});

export default Feed;