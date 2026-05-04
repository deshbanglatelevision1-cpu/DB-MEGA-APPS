import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Sparkles, Loader2, Play, Info, Search, X, RefreshCw, Zap, Share2, User, Facebook, Twitter, MessageCircle, Copy, Link as LinkIcon, ExternalLink } from 'lucide-react';
import YouTube, { YouTubeProps } from 'react-youtube';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { getTrendingVideos, YouTubeVideo, searchVideos, getShorts, YouTubeResponse } from '../services/youtube';
import VideoCard from './VideoCard';
import { cn } from '../lib/utils';

interface HomeFeedProps {
  onVideoSelect: (video: YouTubeVideo) => void;
  searchResults: YouTubeVideo[] | null;
  onClearSearch: () => void;
  searchQuery: string;
  onLoadMoreSearch: (query: string) => void;
  nextSearchPageToken?: string;
  activeTab: 'trending' | 'shorts';
}

interface ShortsPlayerItemProps {
  video: YouTubeVideo;
  isLast: boolean;
  lastVideoElementRef: (node: HTMLDivElement | null) => void;
  onShare: (e: React.MouseEvent, video: YouTubeVideo) => void;
  key?: string | number;
}

function ShortsPlayerItem({ video, isLast, lastVideoElementRef, onShare }: ShortsPlayerItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
          if (playerRef.current) {
            playerRef.current.pauseVideo();
          }
        }
      },
      { 
        threshold: 0.7,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  const onError: YouTubeProps['onError'] = (event) => {
    console.error("Shorts playback error:", event.data);
  };

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isPlaying && playerRef.current) {
      interval = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleToggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      loop: 1,
      playlist: video.id,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      fs: 0,
      disablekb: 1,
      playsinline: 1,
      mute: 1, // Start muted for autoplay reliability
    },
  };

  return (
    <div 
      ref={(node) => {
        if (isLast) lastVideoElementRef(node);
        (containerRef as any).current = node;
      }}
      className="relative w-full h-[calc(100vh-96px)] snap-start snap-always flex flex-col items-center justify-center p-0 bg-black overflow-hidden"
    >
      <div 
        onClick={handleToggleMute}
        className="relative w-full h-full max-w-[min(100vw,calc((100vh-96px)*9/16))] aspect-[9/16] overflow-hidden group bg-black flex items-center justify-center cursor-pointer"
      >
        {isPlaying ? (
          <YouTube 
            videoId={video.id} 
            opts={opts} 
            onReady={onReady}
            onEnd={(e) => e.target.playVideo()} // Ensure looping
            onError={onError}
            className="w-full h-full"
            containerClassName="w-full h-full"
          />
        ) : (
          <div className="relative w-full h-full">
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-white/20 animate-spin" />
            </div>
          </div>
        )}
        
        {isMuted && isPlaying && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-bold uppercase tracking-widest pointer-events-none animate-pulse">
            Tap to Unmute
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
          <div 
            className="h-full bg-rose-600 transition-all duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
        
        <div className="absolute top-6 left-6 pointer-events-none">
          <div className="px-4 py-2 bg-rose-600/90 backdrop-blur-md text-white rounded-full text-xs font-black uppercase tracking-tighter flex items-center gap-2 shadow-lg shadow-rose-600/20">
            <Zap className="w-4 h-4 fill-current" />
            Shorts
          </div>
        </div>

        <div className="absolute bottom-0 left-0 p-8 w-full space-y-6 pointer-events-none">
          <h3 className="text-white text-xl font-bold line-clamp-2 leading-tight drop-shadow-md">
            {video.title}
          </h3>
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10">
                <User className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-bold text-sm truncate max-w-[150px]">
                {video.channelTitle}
              </p>
            </div>
            <button 
              onClick={(e) => onShare(e, video)}
              className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-white transition-all border border-white/10 active:scale-90"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: '10', name: 'Music' },
  { id: '20', name: 'Gaming' },
  { id: '25', name: 'News' },
  { id: '24', name: 'Entertainment' },
  { id: '28', name: 'Tech' },
  { id: '17', name: 'Sports' },
  { id: '23', name: 'Comedy' },
  { id: '27', name: 'Education' },
  { id: '1', name: 'Film & Animation' },
  { id: '2', name: 'Cars & Vehicles' },
  { id: '15', name: 'Pets & Animals' },
  { id: '22', name: 'Blogs' },
  { id: '26', name: 'Politics' },
  { id: 'islamic', name: 'Islamic' },
  { id: 'quran', name: 'Quran' },
  { id: 'documentary', name: 'Documentary' }
];

export default function HomeFeed({ onVideoSelect, searchResults, onClearSearch, searchQuery, onLoadMoreSearch, nextSearchPageToken, activeTab }: HomeFeedProps) {
  const [trending, setTrending] = useState<YouTubeVideo[]>([]);
  const [shorts, setShorts] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [trendingToken, setTrendingToken] = useState<string | undefined>(undefined);
  const [trendingRegion, setTrendingRegion] = useState<string | undefined>(undefined);
  const [shortsToken, setShortsToken] = useState<string | undefined>(undefined);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<YouTubeVideo | null>(null);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const lastVideoElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (searchResults) {
          onLoadMoreSearch(searchQuery);
        } else if (activeTab === 'trending') {
          fetchMoreTrending();
        } else if (activeTab === 'shorts') {
          fetchMoreShorts();
        }
      }
    }, { 
      threshold: 0,
      root: activeTab === 'shorts' ? scrollContainerRef.current : null,
      rootMargin: '400px'
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, trendingToken, trendingRegion, shortsToken, nextSearchPageToken, searchResults, searchQuery, onLoadMoreSearch, activeTab, activeCategoryId]);

  const fetchTrending = async (isRefresh = false, categoryId = activeCategoryId) => {
    if (!isRefresh) setIsLoading(true);
    try {
      let response: YouTubeResponse;
      if (categoryId === 'all') {
        response = await getTrendingVideos();
      } else if (!isNaN(Number(categoryId))) {
        response = await getTrendingVideos(undefined, undefined, categoryId);
      } else {
        // Search by category name if not a numeric ID
        const catName = CATEGORIES.find(c => c.id === categoryId)?.name || categoryId;
        response = await searchVideos(catName);
      }
      setTrending(response.videos);
      setTrendingToken(response.nextPageToken);
      setTrendingRegion(response.region);
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  };

  const fetchMoreTrending = async () => {
    if (isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      let response: YouTubeResponse;
      if (activeCategoryId === 'all') {
        response = await getTrendingVideos(trendingToken, trendingRegion);
      } else if (!isNaN(Number(activeCategoryId))) {
        response = await getTrendingVideos(trendingToken, trendingRegion, activeCategoryId);
      } else {
        const catName = CATEGORIES.find(c => c.id === activeCategoryId)?.name || activeCategoryId;
        response = await searchVideos(catName, trendingToken);
      }

      if (response.videos.length === 0) {
          // If no more videos, try fresh or stop
          if (trendingToken) {
              const freshResponse = await getTrendingVideos(undefined, undefined, activeCategoryId === 'all' ? undefined : activeCategoryId);
              setTrending(prev => [...prev, ...freshResponse.videos]);
              setTrendingToken(freshResponse.nextPageToken);
          }
      } else {
        setTrending(prev => [...prev, ...response.videos]);
        setTrendingToken(response.nextPageToken);
      }
    } catch (error) {
      console.error("Error fetching more trending:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const fetchShorts = async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    try {
      const response = await getShorts();
      setShorts(response.videos);
      setShortsToken(response.nextPageToken);
    } catch (error) {
      console.error("Error fetching shorts:", error);
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  };

  const fetchMoreShorts = async () => {
    if (isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const response = await getShorts(shortsToken);
      if (response.videos.length === 0 && shortsToken) {
        const freshResponse = await getShorts();
        setShorts(prev => [...prev, ...freshResponse.videos]);
        setShortsToken(freshResponse.nextPageToken);
      } else {
        setShorts(prev => [...prev, ...response.videos]);
        setShortsToken(response.nextPageToken);
      }
    } catch (error) {
      console.error("Error fetching more shorts:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'trending') {
      await fetchTrending(true);
    } else if (activeTab === 'shorts') {
      await fetchShorts(true);
    }
    setIsRefreshing(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setTrending([]);
    setTrendingToken(undefined);
    fetchTrending(false, categoryId);
  };

  const handleShare = async (e: React.MouseEvent, video: YouTubeVideo) => {
    e.stopPropagation();
    setShowShareModal(video);
  };

  const copyToClipboard = async (video: YouTubeVideo) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?v=${video.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast('Link copied to clipboard!');
      setTimeout(() => setToast(null), 3000);
      setShowShareModal(null);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToSocial = (platform: string, video: YouTubeVideo) => {
    const shareUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}?v=${video.id}`);
    const text = encodeURIComponent(video.title);
    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${text}%20${shareUrl}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      setShowShareModal(null);
    }
  };

  useEffect(() => {
    if (!searchResults) {
      if (activeTab === 'trending') {
        fetchTrending();
      } else {
        fetchShorts();
      }
    }
  }, [searchResults, activeTab]);

  if (isLoading && !searchResults) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        </div>
        <p className="text-stone-400 font-bold text-xs uppercase tracking-widest animate-pulse">
          Loading global media...
        </p>
      </div>
    );
  }

  const rawVideos: YouTubeVideo[] = searchResults || (activeTab === 'trending' ? trending : shorts);
  const videosToDisplay: YouTubeVideo[] = Array.from(new Map<string, YouTubeVideo>(rawVideos.map(v => [v.id, v])).values());

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className={cn(
        "max-w-7xl mx-auto px-6 py-12 space-y-12 pb-32 min-h-screen relative",
        activeTab === 'shorts' && "max-w-none px-0 py-0 space-y-0 pb-0 overflow-hidden"
      )}>
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
            <div className="px-6 py-3 bg-stone-900 text-white rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 border border-white/10">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {toast}
            </div>
          </div>
        )}

        {/* Refresh button - Always Visible & Sticky */}
        {!searchResults && (
          <div className="fixed bottom-24 right-6 z-50">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl transition-all active:scale-90 disabled:opacity-50 flex items-center justify-center group"
              title="Refresh for Fresh Content"
            >
              <RefreshCw className={cn("w-6 h-6", isRefreshing && "animate-spin")} />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-xs font-bold uppercase tracking-widest">
                Refresh
              </span>
            </button>
          </div>
        )}

        {/* Categories Bar */}
        {!searchResults && activeTab === 'trending' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar sticky top-20 z-20 bg-stone-50/90 backdrop-blur-xl pt-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={cn(
                  "px-5 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all border shrink-0",
                  activeCategoryId === category.id 
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20" 
                    : "bg-white text-stone-500 border-stone-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

      {searchResults ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/20">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-stone-900 tracking-tight leading-none mb-2">
                    Search Results
                  </h2>
                  <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>Found for "{searchQuery}"</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={onClearSearch}
                className="p-3 hover:bg-rose-50 text-stone-400 hover:text-rose-500 rounded-2xl transition-all border border-transparent hover:border-rose-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {videosToDisplay.map((video, index) => {
                const isLast = (videosToDisplay.length === index + 1);
                return (
                  <div ref={isLast ? lastVideoElementRef : null} key={`${video.id}-${index}`}>
                    <VideoCard video={video} onClick={onVideoSelect} onShare={handleShare} />
                  </div>
                );
              })}
            </div>
            
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              {isFetchingMore ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                  <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest">Loading results...</p>
                </div>
              ) : (
                nextSearchPageToken && (
                  <button onClick={() => onLoadMoreSearch(searchQuery)} className="px-8 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl font-bold text-sm transition-all mb-10">
                    Load More Results
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'trending' && (
              <div className="relative h-[400px] rounded-[40px] overflow-hidden group shadow-2xl shadow-emerald-900/10 border border-white/10">
                <img 
                  src={trending[0]?.thumbnail || "https://picsum.photos/seed/media/1920/1080"} 
                  alt="Featured" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-12 w-full max-w-3xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20">
                      Featured Content
                    </div>
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10">
                      Trending Now
                    </div>
                  </div>
                  <h1 className="text-white text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">
                    {trending[0]?.title || "Discover Global Media Content"}
                  </h1>
                  <button 
                    onClick={() => trending[0] && onVideoSelect(trending[0])}
                    className="flex items-center gap-3 px-8 py-4 bg-white text-stone-900 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Watch Now
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-stone-900 rounded-2xl shadow-lg shadow-stone-900/20">
                  {activeTab === 'trending' ? <TrendingUp className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-stone-900 tracking-tight leading-none mb-2">
                    {activeTab === 'trending' ? 'Trending Global' : 'Shorts Infinity'}
                  </h2>
                  <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>{activeTab === 'trending' ? 'Most popular content today' : 'Quick bites of entertainment'}</span>
                  </p>
                </div>
              </div>
              
      <div 
        ref={activeTab === 'shorts' ? scrollContainerRef : null}
        className={cn(
          "grid gap-8 pb-32",
          activeTab === 'shorts' 
            ? "flex flex-col items-center gap-0 snap-y snap-mandatory h-[calc(100vh-96px)] overflow-y-auto overflow-x-hidden no-scrollbar bg-black -mx-6" 
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        )}
      >
              {videosToDisplay.map((video, index) => {
                const isLast = videosToDisplay.length === index + 1;
                if (activeTab === 'shorts') {
                  return (
                    <ShortsPlayerItem 
                      key={`${video.id}-${index}`}
                      video={video}
                      isLast={isLast}
                      lastVideoElementRef={lastVideoElementRef}
                      onShare={handleShare}
                    />
                  );
                }
                return (
                  <div ref={isLast ? lastVideoElementRef : null} key={`${video.id}-${index}`}>
                    <VideoCard video={video} onClick={onVideoSelect} onShare={handleShare} />
                  </div>
                );
              })}

              {/* Improved Infinite Scroll Footer for Main Tabs */}
              {activeTab !== 'shorts' && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                  {isFetchingMore ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                      <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Loading fresh content...</p>
                    </div>
                  ) : (
                    trendingToken && (
                      <button onClick={fetchMoreTrending} className="px-8 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl font-bold text-sm transition-all mb-10 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Load More
                      </button>
                    )
                  )}
                </div>
              )}

              {activeTab === 'shorts' && isFetchingMore && (
                <div className="flex justify-center py-20 w-full snap-start bg-black">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-white animate-spin opacity-50" />
                    <p className="text-white/40 font-black text-xs uppercase tracking-tighter">Next Short Loading</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

        {/* Share Modal Overlay */}
        {showShareModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xl" onClick={() => setShowShareModal(null)} />
            <div className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 space-y-8 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-rose-500 to-emerald-500 animate-gradient-x" />
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-stone-900 tracking-tight mb-1">Share Media</h3>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Select Platform</p>
                </div>
                <button onClick={() => setShowShareModal(null)} className="p-3 bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-500 rounded-2xl transition-all">
                  <X className="w-5 h-5" />
                </button>
               </div>
               <div className="space-y-3">
                 <button onClick={() => shareToSocial('whatsapp', showShareModal)} className="w-full h-14 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-2xl flex items-center gap-4 px-6 font-bold transition-all group">
                   <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                   <span>WhatsApp</span>
                 </button>
                 <button onClick={() => shareToSocial('facebook', showShareModal)} className="w-full h-14 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-2xl flex items-center gap-4 px-6 font-bold transition-all group">
                   <Facebook className="w-6 h-6 group-hover:scale-110 transition-transform" />
                   <span>Facebook</span>
                 </button>
                 <button onClick={() => shareToSocial('twitter', showShareModal)} className="w-full h-14 bg-stone-900/10 hover:bg-stone-900/20 text-stone-900 rounded-2xl flex items-center gap-4 px-6 font-bold transition-all group">
                   <Twitter className="w-6 h-6 group-hover:scale-110 transition-transform" />
                   <span>Twitter / X</span>
                 </button>
               </div>
               <div className="pt-4 border-t border-stone-100">
                 <button onClick={() => copyToClipboard(showShareModal)} className="w-full h-14 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-2xl flex items-center justify-between px-6 font-bold transition-all group">
                   <div className="flex items-center gap-4">
                     <LinkIcon className="w-5 h-5 text-stone-400" />
                     <span>Copy Video Link</span>
                   </div>
                   <Copy className="w-4 h-4 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
