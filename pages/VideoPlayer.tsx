import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

interface RelatedVideo {
  id: string;
  title: string;
  artist: string;
  views: string;
  duration: string;
  img: string;
  url: string;
}

const VideoPlayer: React.FC = () => {
  const { id } = useParams();
  const navigation = useNavigation<any>();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // App States
  const [userRole] = useState(() => {
    const saved = localStorage.getItem('pulsar_user');
    return saved ? JSON.parse(saved).role : 'fan';
  });
  const isCreator = userRole === 'creator';

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true); // Default to muted for autoplay reliability
  const [showControls, setShowControls] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [studioMode, setStudioMode] = useState(isCreator);
  
  // Queue States
  const [videoQueue, setVideoQueue] = useState<RelatedVideo[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Content Protocol State
  const [protocol, setProtocol] = useState<'public' | 'premium'>('public');
  const [tier, setTier] = useState<'bronze' | 'silver' | 'gold'>('silver');
  const [isSyncing, setIsSyncing] = useState(false);

  // All Dummy Videos with stable GTV URLs
  const dummyContent: Record<string, any> = {
    'burna-boy': {
      title: "Love, Damini - Live in London",
      artist: "Burna Boy",
      handle: "@burnaboygram",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
    },
    'v1': {
       title: "Digital Dreams Rehearsal",
       artist: "Elena Rose",
       handle: "@elena_rose",
       url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    },
    'v2': {
       title: "Moonlight Symphony",
       artist: "Elena Rose",
       handle: "@elena_rose",
       url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    'v3': {
       title: "Lagos Energy Live",
       artist: "Zion King",
       handle: "@zion_afro",
       url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    },
    'v4': {
       title: "Synth Soul Sessions",
       artist: "Luna Ray",
       handle: "@luna_ray",
       url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    }
  };

  const videoData = dummyContent[id || 'v1'] || dummyContent['v1'];
  videoData.views = "1.2M";
  videoData.date = "Aug 24, 2024";
  videoData.description = "Experience the magic of the universe. This performance features exclusive choreography and never-before-seen visuals curated for the Kulsah Galaxy.";

  const upNext: RelatedVideo[] = [
    { id: 'v2', title: "Moonlight Symphony", artist: "Elena Rose", views: "450K", duration: "4:20", img: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
    { id: 'v3', title: "Lagos Energy Live", artist: "Zion King", views: "890K", duration: "12:15", img: "https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=400", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" },
    { id: 'v4', title: "Synth Soul Sessions", artist: "Luna Ray", views: "120K", duration: "8:45", img: "https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=400", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" },
  ];

  const heatmap = useMemo(() => {
    return Array.from({ length: 20 }, () => Math.floor(Math.random() * 80) + 20);
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let timeout: any;
    if (showControls && isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 4000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, isPlaying]);

  const syncMediaState = () => {
    if (videoRef.current) {
      setIsPlaying(!videoRef.current.paused);
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
      setDuration(videoRef.current.duration || 0);
      setPlaybackSpeed(videoRef.current.playbackRate);
    }
  };

  const handleLoadedMetadata = () => {
    syncMediaState();
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(e => console.debug("Autoplay delay"));
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => console.debug("Playback failed", e));
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration > 0) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(cur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekToPercent = parseFloat(value);
    if (videoRef.current && duration > 0) {
      const newTime = (seekToPercent / 100) * duration;
      videoRef.current.currentTime = newTime;
      setProgress(seekToPercent);
      setCurrentTime(newTime);
    }
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      if (!videoRef.current.muted && videoRef.current.volume === 0) {
        videoRef.current.volume = 0.5;
      }
    }
  };

  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    const newSpeed = SPEED_OPTIONS[nextIndex];
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const addToQueue = (video: RelatedVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoQueue.find(v => v.id === video.id)) {
        triggerToast("Already in Queue");
        return;
    }
    setVideoQueue(prev => [...prev, video]);
    triggerToast("Added to Galaxy Queue");
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const playNextInQueue = () => {
    if (videoQueue.length > 0) {
      const nextVid = videoQueue[0];
      setVideoQueue(prev => prev.slice(1));
      navigation.navigate(`/video/${nextVid.id}`);
    } else {
       setIsPlaying(false);
    }
  };

  const handleProtocolSync = (newProtocol: 'public' | 'premium') => {
    setIsSyncing(true);
    setTimeout(() => {
      setProtocol(newProtocol);
      setIsSyncing(false);
    }, 1500);
  };

  const fetchAiPerformanceAudit = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a video performance coach. A video has a 85% retention spike at 0:45. The title is "${videoData.title}". Give 1 specific tactic to Mila Ray to capitalize on this peak in her next upload. 1 sentence max.`,
      });
      setAiInsight(response.text || "Viewers are re-watching the bridge transition. Use a similar visual echo in your next drop to maximize engagement.");
    } catch (e) {
      setAiInsight("Retention Alert: Significant spike detected at 0:45. Your high-fidelity visuals are creating deep fan resonance here.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <View>
      <style>{`
        input[type=range].video-scrubber::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #cd2bee;
          box-shadow: 0 0 10px #cd2bee;
          cursor: pointer;
          border: 2px solid white;
          margin-top: -6px;
        }
        input[type=range].video-scrubber::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          background: rgba(15, 23, 42, 0.1);
          border-radius: 2px;
        }
        .dark input[type=range].video-scrubber::-webkit-slider-runnable-track {
          background: rgba(255, 255, 255, 0.1);
        }
        input[type=range].volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #cd2bee;
          cursor: pointer;
          margin-top: -4px;
        }
        input[type=range].volume-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          background: rgba(15, 23, 42, 0.2);
          border-radius: 2px;
        }
        .dark input[type=range].volume-slider::-webkit-slider-runnable-track {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <View></View>

      {showToast && (
        <View>
          {showToast}
        </View>
      )}

      <View>
        <Pressable 
          onPress={() => navigation.goBack()} 
         
        >
          <Text>arrow_back</Text>
        </Pressable>
        <View>
           {isCreator && (
             <Pressable 
               onPress={() => setStudioMode(!studioMode)}
              
             >
               <Text>analytics</Text>
               Studio Mode
             </Pressable>
           )}
           <Pressable 
             onPress={cycleSpeed}
            
           >
             {playbackSpeed}x
           </Pressable>
        </View>
      </View>

      <View 
       
        onMouseMove={() => setShowControls(true)}
        onTouchStart={() => setShowControls(true)}
      >
        <View 
         
          onPress={(e) => { e.stopPropagation(); togglePlay(); }}
        >
          <video 
            ref={videoRef}
            src={videoData.url}
           
            onTimeUpdate={handleTimeUpdate}
            onPlay={syncMediaState}
            onPause={syncMediaState}
            onPlaying={syncMediaState}
            onLoadedMetadata={handleLoadedMetadata}
            onDurationChange={syncMediaState}
            onRateChange={syncMediaState}
            onVolumeChange={syncMediaState}
            onEnded={playNextInQueue}
            playsInline
            autoPlay
            muted={isMuted}
          />

          {studioMode && (
            <View>
              <View>
                {heatmap.map((h, i) => (
                  <View key={i} style={{ height: `${h}%` }}></View>
                ))}
              </View>
            </View>
          )}

          <View>
             <View>
                <Pressable onPress={(e) => { e.stopPropagation(); if(videoRef.current) videoRef.current.currentTime -= 10; }}>
                  <Text>replay_10</Text>
                </Pressable>
                <Pressable onPress={(e) => { e.stopPropagation(); togglePlay(); }}>
                  <Text>{isPlaying ? 'pause' : 'play_arrow'}</Text>
                </Pressable>
                <Pressable onPress={(e) => { e.stopPropagation(); if(videoRef.current) videoRef.current.currentTime += 10; }}>
                  <Text>forward_10</Text>
                </Pressable>
             </View>

             <View>
                <Pressable onPress={(e) => { e.stopPropagation(); toggleMute(); }}>
                  <Text>
                    {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                  </Text>
                </Pressable>
                <TextInput 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeSliderChange}
                  onPress={(e) => e.stopPropagation()}
                 
                />
             </View>
          </View>

          <View>
             <TextInput 
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={isNaN(progress) ? 0 : progress}
                onChange={handleSeek}
               
             />
             <View>
                <View>
                   <Text>{formatTime(currentTime)}</Text>
                   <Text>/</Text>
                   <Text>{formatTime(duration)}</Text>
                </View>
                <Text>{videoData.date}</Text>
             </View>
          </View>
        </View>

        {studioMode ? (
          <View>
            <View>
              {[
                { label: 'Watch Time', val: '8.2k hrs', color: 'text-blue-400', icon: 'schedule' },
                { label: 'Retention', val: '72%', color: 'text-emerald-400', icon: 'auto_graph' },
                { label: 'Net Revenue', val: '$4,120', color: 'text-primary', icon: 'payments' },
              ].map((stat, i) => (
                <View key={i}>
                  <Text>
                  <Text>{stat.val}</Text>
                  <Text>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View>
              <View>
                <Text>Uplink Protocols</Text>
                {isSyncing && <View></View>}
              </View>

              <View>
                <Pressable 
                  onPress={() => handleProtocolSync('public')}
                 
                >
                  <Text>public</Text>
                  <View>
                    <Text>Public Feed</Text>
                    <Text>Visible to all</Text>
                  </View>
                </Pressable>
                <Pressable 
                  onPress={() => handleProtocolSync('premium')}
                 
                >
                  <Text>stars</Text>
                  <View>
                    <Text>Premium Locked</Text>
                    <Text>Members only</Text>
                  </View>
                </Pressable>
              </View>

              {protocol === 'premium' && (
                <View>
                  <Text>Access Tier Required</Text>
                  <View>
                    {['bronze', 'silver', 'gold'].map((t) => (
                      <Pressable 
                        key={t}
                        onPress={() => setTier(t as any)}
                       
                      >
                        {t}
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View>
              <View></View>
              <View>
                <View>
                  <View>
                    <View>
                      <Text>psychology</Text>
                    </View>
                    <View>
                      <Text>Engagement Auditor</Text>
                      <Text>Retention Analysis Engine</Text>
                    </View>
                  </View>
                  {isAiLoading && <View></View>}
                </View>
                <Text>
                  {aiInsight || "Gemini is ready to audit your watch-time retention patterns."}
                </Text>
                {!aiInsight && (
                  <Pressable 
                    onPress={fetchAiPerformanceAudit}
                    disabled={isAiLoading}
                   
                  >
                    Run Engagement Audit
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View>
            <View>
              <View>
                <Text>{videoData.title}</Text>
                <View>
                  <Text>{videoData.views} Views</Text>
                  <Text></Text>
                  <Text>{videoData.date}</Text>
                </View>
              </View>

              <View>
                 <Pressable 
                  onPress={() => setIsLiked(!isLiked)}
                 
                 >
                   <Text>favorite</Text>
                   <Text>12k</Text>
                 </Pressable>
                 <Pressable>
                   <Text>share</Text>
                   <Text>Share</Text>
                 </Pressable>
                 <Pressable>
                   <Text>add_box</Text>
                   <Text>Library</Text>
                 </Pressable>
              </View>

              <View>
                <View onPress={() => navigation.navigate(`/profile/${videoData.artist}`)}>
                  <View>
                    <Image source={{ uri: "https://picsum.photos/seed/elena/150" }} />
                  </View>
                  <View>
                    <View>
                      <Text>{videoData.artist}</Text>
                      <Text>verified</Text>
                    </View>
                    <Text>{videoData.handle}</Text>
                  </View>
                </View>
                <Pressable>Follow</Pressable>
              </View>
            </View>

            <View>
               <Text>About Transmission</Text>
               <Text>
                 {videoData.description}
               </Text>
            </View>

            <View>
              <View>
                <View>
                    <Text>Up Next</Text>
                    {videoQueue.length > 0 && (
                        <Text>
                            {videoQueue.length} IN QUEUE
                        </Text>
                    )}
                </View>
                <Pressable 
                  onPress={() => setIsQueueOpen(true)}
                 
                >
                  <Text>playlist_play</Text>
                  <Text>Manage Queue</Text>
                </Pressable>
              </View>
              
              <View>
                {upNext.map((video, idx) => {
                  const isInQueue = !!videoQueue.find(v => v.id === video.id);
                  return (
                    <View 
                      key={video.id}
                     
                    >
                      <View 
                        onPress={() => navigation.navigate(`/video/${video.id}`)}
                       
                      >
                        <Image source={{ uri: video.img }} />
                        <View></View>
                        
                        {idx === 0 && (
                          <View>
                            <Text>Next Focus</Text>
                          </View>
                        )}

                        <View>
                          {video.duration}
                        </View>
                        
                        <View>
                          <View>
                            <Text>play_arrow</Text>
                          </View>
                        </View>
                      </View>

                      <View>
                        <View onPress={() => navigation.navigate(`/video/${video.id}`)}>
                          <Text>{video.title}</Text>
                          <Text>{video.artist}</Text>
                        </View>
                        
                        <View>
                          <Pressable 
                            onPress={(e) => addToQueue(video, e)}
                            disabled={isInQueue}
                           
                          >
                            <Text>
                              {isInQueue ? 'done_all' : 'playlist_add'}
                            </Text>
                            {isInQueue ? 'Queued' : 'Add to Queue'}
                          </Pressable>
                          <Text>{video.views} views</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View>
                 <View>
                    <Text>expand_more</Text>
                 </View>
                 <Text>Syncing related transmissions...</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Queue Drawer */}
      {isQueueOpen && (
        <View>
          <View 
            
            onPress={() => setIsQueueOpen(false)}
          ></View>
          <View>
            <View></View>
            
            <View>
              <View>
                <Text>Broadcast Queue</Text>
                <Text>{videoQueue.length} Pending</Text>
              </View>
              <Pressable 
                onPress={() => setIsQueueOpen(false)} 
               
              >
                <Text>close</Text>
              </Pressable>
            </View>

            <View>
               {videoQueue.length > 0 ? (
                 videoQueue.map((track, idx) => (
                   <View 
                    key={track.id + idx} 
                    onPress={() => {
                        setIsQueueOpen(false);
                        const nextQ = [...videoQueue];
                        nextQ.splice(idx, 1);
                        setVideoQueue(nextQ);
                        navigation.navigate(`/video/${track.id}`);
                    }} 
                   
                   >
                     <View>
                        <Image source={{ uri: track.img }} />
                        <View></View>
                     </View>
                     <View>
                       <Text>{track.title}</Text>
                       <Text>{track.artist}</Text>
                     </View>
                     <View>
                        <Text>{track.duration}</Text>
                        <Pressable 
                            onPress={(e) => {
                                e.stopPropagation();
                                setVideoQueue(prev => prev.filter((_, i) => i !== idx));
                            }}
                           
                        >
                            <Text>remove_circle_outline</Text>
                        </Pressable>
                     </View>
                   </View>
                 ))
               ) : (
                 <View>
                    <Text>playlist_play</Text>
                    <Text>No transmissions queued</Text>
                 </View>
               )}
            </View>

            {videoQueue.length > 0 && (
                <View>
                    <Pressable 
                        onPress={() => setVideoQueue([])}
                       
                    >
                        Clear All
                    </Pressable>
                    <Pressable 
                        onPress={playNextInQueue}
                       
                    >
                        Play Next
                    </Pressable>
                </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default VideoPlayer;
