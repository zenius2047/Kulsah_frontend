import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';

interface FeedItem {
  id: string;
  artist: string;
  handle: string;
  avatar: string;
  caption: string;
  background: string;
  video: string;
  likes: string;
  comments: string;
  isLiked: boolean;
  isSubscribed: boolean;
  isPremium: boolean;
  ticketsAvailable: boolean;
  ticketLocation?: string;
}

const FALLBACK_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const VideoFeedItem: React.FC<{
  item: FeedItem;
  onSubscribe: (id: string) => void;
  isGlobalMuted: boolean;
  onToggleMute: () => void;
}> = ({ item, onSubscribe, isGlobalMuted, onToggleMute }) => {
  const navigation = useNavigation<any>();
  const navigate = (path: string) => {
    if (path === '/discover') return navigation.navigate('Discover');
    if (path === '/notifications') return;
    if (path.startsWith('/video/')) return navigation.navigate('Video');
    if (path.startsWith('/profile/')) return;
    if (path.startsWith('/event/')) return;
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [showActionIcon, setShowActionIcon] = useState<'play' | 'pause' | null>(null);
  const [hasSourceError, setHasSourceError] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isGlobalMuted;
    }
  }, [isGlobalMuted]);

  useEffect(() => {
    const options = { threshold: 0.5 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const v = videoRef.current;
          if (v) {
            v.play().catch(() => {
              console.debug('Autoplay pending interaction');
            });
          }
        } else {
          videoRef.current?.pause();
        }
      });
    }, options);

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [hasSourceError]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((err) => console.debug('Manual play failed', err));
        setShowActionIcon('play');
      } else {
        videoRef.current.pause();
        setShowActionIcon('pause');
      }
      setTimeout(() => setShowActionIcon(null), 800);
    }
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleVideoError = () => {
    if (!hasSourceError) {
      setHasSourceError(true);
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full snap-start flex flex-col justify-end overflow-hidden bg-black"
      onClick={togglePlayPause}
    >
      <video
        ref={videoRef}
        src={hasSourceError ? FALLBACK_VIDEO : item.video || FALLBACK_VIDEO}
        poster={item.background}
        muted={isGlobalMuted}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        loop
        playsInline
        autoPlay
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        onError={handleVideoError}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {showActionIcon && (
          <div className="size-24 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white animate-out fade-out zoom-out duration-700">
            <span className="material-symbols-outlined text-6xl fill-1">
              {showActionIcon === 'play' ? 'play_arrow' : 'pause'}
            </span>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
        className="absolute top-28 right-4 z-30 size-10 rounded-full glass border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-[22px]">{isGlobalMuted ? 'volume_off' : 'volume_up'}</span>
      </button>

      {isGlobalMuted && isPlaying && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 pointer-events-none animate-pulse">
          <p className="text-[9px] font-black text-white uppercase tracking-widest">Tap for sound</p>
        </div>
      )}

      <div className="absolute right-4 bottom-28 z-20 flex flex-col items-center gap-6">
        <div className="relative mb-2">
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${item.artist}`);
            }}
            className="size-12 rounded-full border-2 border-white p-0.5 bg-zinc-900 overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-soft"
          >
            <img src={item.avatar} className="w-full h-full rounded-full object-cover" alt={item.artist} />
          </div>
          {!item.isSubscribed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSubscribe(item.id);
              }}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-5 bg-primary rounded-full flex items-center justify-center border-2 border-white text-white shadow-soft active:scale-110 transition-transform"
            >
              <span className="material-symbols-outlined text-[12px] font-black">add</span>
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <button onClick={toggleLike} className={`text-white transition-all active:scale-75 ${isLiked ? 'text-primary' : ''}`}>
            <span className={`material-symbols-outlined text-[36px] ${isLiked ? 'fill-1' : ''}`}>favorite</span>
          </button>
          <span className="text-[11px] font-black text-white drop-shadow-sm">{item.likes}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(true);
            }}
            className="text-white hover:text-primary transition-all active:scale-75"
          >
            <span className="material-symbols-outlined text-[36px] fill-1">chat_bubble</span>
          </button>
          <span className="text-[11px] font-black text-white drop-shadow-sm">{item.comments}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${item.artist}`);
            }}
            className={`size-12 rounded-full flex items-center justify-center text-white shadow-soft active:scale-90 transition-all border border-white/20 ${
              item.isSubscribed ? 'bg-primary/20 text-primary border-primary/40' : 'bg-gradient-to-br from-[#7000ff] via-primary to-[#ff0099]'
            }`}
          >
            <span className={`material-symbols-outlined text-[28px] ${item.isSubscribed ? 'fill-1' : ''}`}>stars</span>
          </button>
          <span className={`text-[10px] font-black uppercase tracking-widest drop-shadow-sm ${item.isSubscribed ? 'text-primary' : 'text-white'}`}>
            {item.isSubscribed ? 'Subbed' : 'Sub'}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="text-white hover:opacity-80 transition-all active:scale-75"
          >
            <span className="material-symbols-outlined text-[34px]">share</span>
          </button>
          <span className="text-[11px] font-black text-white drop-shadow-sm">Share</span>
        </div>
      </div>

      <div className="relative z-10 px-6 pb-24 flex flex-col gap-3 pointer-events-none">
        <div className="flex flex-col gap-1.5 max-w-[80%]">
          <div className="flex items-center gap-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <h2
              className="text-white font-black text-xl tracking-tight drop-shadow-sm cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/profile/${item.artist}`)}
            >
              @{item.handle}
            </h2>
            {item.isPremium && (
              <div className="bg-primary/20 backdrop-blur-md border border-primary/30 px-2 py-0.5 rounded text-[8px] font-black text-primary uppercase tracking-tighter shadow-md">Premium</div>
            )}
            <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 px-1.5 py-0.5 rounded text-[8px] font-black text-green-400 uppercase tracking-tighter shadow-md">On Air</div>
          </div>
          <p className="text-white/90 text-[13px] leading-relaxed font-medium line-clamp-3 drop-shadow-sm">{item.caption}</p>
        </div>

        {item.ticketsAvailable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/event/burna-boy');
            }}
            className="bg-green-500 text-black w-fit px-5 h-10 rounded-full flex items-center gap-2 shadow-soft active:scale-95 transition-all mt-1 pointer-events-auto"
          >
            <span className="material-symbols-outlined text-[20px] font-black">confirmation_number</span>
            <span className="text-[10px] font-black uppercase tracking-[2px]">Tickets - {item.ticketLocation}</span>
          </button>
        )}
      </div>

      {showComments && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowComments(false)}></div>
          <div className="relative w-full bg-background-light dark:bg-background-dark rounded-t-[40px] p-6 pb-12 animate-in slide-in-from-bottom-full duration-300 border-t border-white/10">
            <div className="w-12 h-1.5 bg-black/10 dark:bg-white/10 mx-auto rounded-full mb-6"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-white/50">{item.comments} Comments</h3>
              <button onClick={() => setShowComments(false)} className="text-white/40 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-6 max-h-[40vh] overflow-y-auto no-scrollbar mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 text-left">
                  <div className="size-10 rounded-full bg-black/10 dark:bg-white/5 overflow-hidden border border-white/10">
                    <img src={`https://picsum.photos/seed/fan${i}/100`} className="size-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-900 dark:text-white/90">GalaxyFan_{i}</p>
                    <p className="text-sm text-slate-600 dark:text-white/60 mt-0.5">This visual is absolute fire! {i % 2 === 0 ? 'SkyFire' : 'SparkAudio'}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">2h</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Reply</p>
                    </div>
                  </div>
                  <button className="text-slate-400">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/10">
              <input className="flex-1 bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white" placeholder="Add a comment..." />
              <button className="text-primary font-black text-xs uppercase tracking-widest">Post</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const Feed: React.FC = () => {
  const navigation = useNavigation<any>();
  const navigate = (path: string) => {
    if (path === '/discover') return navigation.navigate('Discover');
    if (path === '/notifications') return;
  };

  const [activeTab, setActiveTab] = useState<'following' | 'foryou'>('foryou');
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);

  const [items, setItems] = useState<FeedItem[]>([
    {
      id: '1',
      artist: 'Elena Rose',
      handle: 'elena_rose',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
    },
    {
      id: '4',
      artist: 'Marcus Thorne',
      handle: 'mthorne_bass',
      avatar: 'https://picsum.photos/seed/mthorne/150/150',
      caption: "SUBSCRIBER REHEARSAL: Early draft of the winter tour set. Gold Tier circle, let's vibe. #PrivatDrop",
      background: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      likes: '450K',
      comments: '12.2K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
    },
    {
      id: '2',
      artist: 'Zion King',
      handle: 'zionking_afro',
      avatar: 'https://picsum.photos/seed/zion/150/150',
      caption: 'Live from the main stage! This crowd is unmatched. #Kulsah #LiveMusic #Afrobeats',
      background: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      likes: '1.2M',
      comments: '45.8K',
      isLiked: true,
      isSubscribed: false,
      isPremium: false,
      ticketsAvailable: false,
    },
    {
      id: '5',
      artist: 'Sarah Chen',
      handle: 'schen_music',
      avatar: 'https://picsum.photos/seed/sarah/150/150',
      caption: "VIP MASTERCLASS: Layering vocal chains for the 'Galaxy' sound. #ProducerLife #PremiumContent",
      background: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      likes: '89K',
      comments: '4.5K',
      isLiked: true,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
    },
    {
      id: '3',
      artist: 'Amara',
      handle: 'amara_official',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
    },
  ]);

  const displayedItems = useMemo(() => {
    if (activeTab === 'following') return items.filter((i) => i.isSubscribed);
    return items;
  }, [activeTab, items]);

  const handleSubscribe = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isSubscribed: true } : item)));
  };

  const toggleMute = () => setIsGlobalMuted(!isGlobalMuted);

  return (
    <div className="h-screen w-full bg-background-dark overflow-y-scroll snap-y snap-mandatory no-scrollbar relative font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 pt-12 pointer-events-none">
        <button
          onClick={() => navigate('/discover')}
          className="size-10 flex items-center justify-center text-white pointer-events-auto active:scale-90 transition-transform bg-black/10 backdrop-blur-md rounded-full border border-white/10"
        >
          <span className="material-symbols-outlined text-[28px]">search</span>
        </button>

        <div className="flex bg-black/30 backdrop-blur-xl rounded-full p-1 border border-white/10 pointer-events-auto shadow-md">
          <button
            onClick={() => setActiveTab('following')}
            className={`px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all ${activeTab === 'following' ? 'bg-white/20 text-white' : 'text-white/40'}`}
          >
            FOLLOWING
          </button>
          <button
            onClick={() => setActiveTab('foryou')}
            className={`px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all ${activeTab === 'foryou' ? 'bg-white/20 text-white' : 'text-white/40'}`}
          >
            FOR YOU
          </button>
        </div>

        <button
          onClick={() => navigate('/notifications')}
          className="size-10 flex items-center justify-center text-white pointer-events-auto active:scale-90 transition-transform bg-black/10 backdrop-blur-md rounded-full border border-white/10"
        >
          <span className="material-symbols-outlined text-[28px]">notifications</span>
        </button>
      </header>

      {displayedItems.length > 0 ? (
        displayedItems.map((item) => (
          <VideoFeedItem key={item.id} item={item} onSubscribe={handleSubscribe} isGlobalMuted={isGlobalMuted} onToggleMute={toggleMute} />
        ))
      ) : (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black p-8 text-center">
          <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-4xl">person_add</span>
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Your Orbit is Empty</h3>
          <p className="text-white/50 text-sm mt-2 max-w-xs mx-auto">Follow creators in the galaxy to see their latest exclusive transmissions here.</p>
          <button onClick={() => setActiveTab('foryou')} className="mt-8 h-14 px-8 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow">
            Discover Creators
          </button>
        </div>
      )}

      <div className="h-20 w-full bg-black flex items-center justify-center snap-start">
        <div className="flex flex-col items-center gap-2 opacity-30">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[8px] font-black text-white uppercase tracking-widest">Syncing more galaxy feed...</p>
        </div>
      </div>
    </div>
  );
};

export default Feed;
