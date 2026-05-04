import React, { useEffect, useState, useRef, useCallback } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { X, Maximize, Minimize, Share2, Info, Loader2, Sparkles, Heart, Languages, List } from 'lucide-react';
import { YouTubeVideo, getRelatedVideos } from '../services/youtube';
import VideoCard from './VideoCard';
import { cn } from '../lib/utils';
import { useLikes } from '../hooks/useLikes';

interface VideoPlayerProps {
  video: YouTubeVideo | null;
  onClose: () => void;
  onVideoSelect: (video: YouTubeVideo) => void;
  onShare: (e: React.MouseEvent | undefined, video: YouTubeVideo) => void;
}

export default function VideoPlayer({ video, onClose, onVideoSelect, onShare }: VideoPlayerProps) {
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { isLiked, toggleLike } = useLikes();
  
  const liked = video ? isLiked(video.id) : false;
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastVideoElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingRelated || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextPageToken) {
        fetchMoreRelated();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoadingRelated, isFetchingMore, nextPageToken]);

  const fetchRelated = async () => {
    if (!video) return;
    setIsLoadingRelated(true);
    const response = await getRelatedVideos(video.id);
    setRelatedVideos(response.videos);
    setNextPageToken(response.nextPageToken);
    setIsLoadingRelated(false);
  };

  const fetchMoreRelated = async () => {
    if (!video || !nextPageToken || isFetchingMore) return;
    setIsFetchingMore(true);
    const response = await getRelatedVideos(video.id, nextPageToken);
    setRelatedVideos(prev => [...prev, ...response.videos]);
    setNextPageToken(response.nextPageToken);
    setIsFetchingMore(false);
  };

  useEffect(() => {
    if (video) {
      fetchRelated();
      setDuration(0);
      setCurrentTime(0);
    } else {
      setRelatedVideos([]);
      setNextPageToken(undefined);
    }
  }, [video]);

  if (!video) return null;

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      controls: 1,
      fs: 1,
      origin: window.location.origin,
      cc_load_policy: 1,
      cc_lang_pref: 'en',
    },
  };

  const [player, setPlayer] = useState<any>(null);
  const [isCCToggled, setIsCCToggled] = useState(true);

  const chapters = React.useMemo(() => {
    if (!video.description) return [];
    const lines = video.description.split('\n');
    const regex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/;
    const results: { time: number; title: string; timeStr: string }[] = [];
    
    lines.forEach(line => {
      const match = line.match(regex);
      if (match) {
        const hours = match[1] ? parseInt(match[1]) : 0;
        const minutes = parseInt(match[2]);
        const seconds = parseInt(match[3]);
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        const title = line.replace(match[0], '').trim().replace(/^[-: ]+/, '');
        results.push({ time: totalSeconds, title: title || 'Untitled Chapter', timeStr: match[0] });
      }
    });

    return results.sort((a, b) => a.time - b.time);
  }, [video.description]);

  const currentChapterIndex = chapters.reduce((acc, c, idx) => (currentTime >= c.time ? idx : acc), -1);

  useEffect(() => {
    let interval: any;
    if (player) {
      interval = setInterval(() => {
        try {
          if (player.getCurrentTime) {
            setCurrentTime(player.getCurrentTime());
          }
          if (player.getDuration && duration === 0) {
            setDuration(player.getDuration());
          }
        } catch (e) {
          // Player might be unmounted or state changed
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [player]);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
    // Ensure the video plays immediately on the first click
    event.target.playVideo();
  };

  const toggleCC = () => {
    if (player) {
      if (isCCToggled) {
        player.unloadModule('captions');
        player.unloadModule('cc');
      } else {
        player.loadModule('captions');
        player.loadModule('cc');
      }
      setIsCCToggled(!isCCToggled);
    }
  };

  const seekTo = (seconds: number) => {
    if (player) {
      player.seekTo(seconds, true);
      player.playVideo();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
      <div className="sticky top-0 z-10 p-4 flex items-center justify-between bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <Info className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-white font-bold text-lg tracking-tight truncate max-w-[200px] md:max-w-[400px]">
            {video.title}
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-none flex items-center justify-center p-4 md:p-8">
        <div className={cn(
          "w-full overflow-hidden shadow-2xl border border-white/10 transition-all duration-500",
          video.isShort 
            ? "max-w-sm aspect-[9/16] rounded-[32px]" 
            : "max-w-5xl aspect-video rounded-2xl"
        )}>
          <YouTube 
            videoId={video.id} 
            opts={opts} 
            onReady={onPlayerReady}
            className="w-full h-full"
            containerClassName="w-full h-full"
          />
        </div>
      </div>

      {chapters.length > 0 && duration > 0 && (
        <div className="max-w-5xl mx-auto w-full px-4 md:px-8 mb-8">
          <div className="relative h-3 bg-white/5 rounded-full border border-white/5 overflow-hidden group cursor-pointer transition-all hover:h-4">
            {/* Base track */}
            <div className="absolute inset-0 bg-white/5" />
            
            {/* Progress Fill */}
            <div 
              className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
              style={{ width: `${(currentTime / duration) * 100}%` }} 
            />
            
            {/* Markers */}
            {chapters.map((chapter, idx) => (
              <div 
                key={`marker-tl-${idx}`}
                className={cn(
                  "absolute top-0 bottom-0 w-[2px] z-10 transition-colors",
                  currentTime >= chapter.time ? "bg-white/30" : "bg-white/10"
                )}
                style={{ left: `${(chapter.time / duration) * 100}%` }}
                title={chapter.title}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between items-center text-[10px] font-mono text-stone-500 uppercase tracking-widest px-1">
            <span>0:00</span>
            <span className="text-white font-bold">{chapters[currentChapterIndex]?.title || 'Playback'}</span>
            <span>{new Date(duration * 1000).toISOString().substr(11, 8).replace(/^00:/, '')}</span>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h1 className="text-white text-3xl font-bold leading-tight tracking-tight">
                {video.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-stone-400 text-sm font-medium">
                  {video.channelTitle}
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleLike(video.id)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all backdrop-blur-md border",
                      liked 
                        ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20" 
                        : "bg-white/5 hover:bg-rose-500 text-stone-400 hover:text-white border-white/10"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                    {liked ? 'Liked' : 'Like'}
                  </button>
                  <button 
                    onClick={toggleCC}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all backdrop-blur-md border",
                      isCCToggled 
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20" 
                        : "bg-white/5 hover:bg-emerald-600 text-stone-400 hover:text-white border-white/10"
                    )}
                  >
                    <Languages className="w-4 h-4" />
                    {isCCToggled ? 'Captions On' : 'Captions Off'}
                  </button>
                  <button 
                    onClick={() => onShare(undefined, video)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all backdrop-blur-md border border-white/5"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20">
                    <Maximize className="w-4 h-4" />
                    Full Screen
                  </button>
                </div>
              </div>
            </div>

            {chapters.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-xl flex items-center gap-2">
                    <List className="w-5 h-5 text-emerald-500" />
                    Chapters
                  </h3>
                  <span className="text-stone-500 text-sm font-medium">{chapters.length} segments</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {chapters.map((chapter, idx) => (
                    <button
                      key={`${chapter.time}-${idx}`}
                      onClick={() => seekTo(chapter.time)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                        currentChapterIndex === idx
                          ? "bg-emerald-600/10 border-emerald-500/50 text-white"
                          : "bg-white/5 border-white/5 hover:bg-white/10 text-stone-400 hover:text-white"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 flex-none flex items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors",
                        currentChapterIndex === idx
                          ? "bg-emerald-500 text-white"
                          : "bg-white/10 text-stone-400 group-hover:bg-emerald-500 group-hover:text-white"
                      )}>
                        {chapter.timeStr}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{chapter.title}</p>
                        {currentChapterIndex === idx && (
                          <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden shadow-inner">
                            <div className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ width: '100%' }} />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Up Next
              </h3>
              {isLoadingRelated && <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />}
            </div>

            <div className="space-y-6">
              {relatedVideos.map((v, index) => {
                if (relatedVideos.length === index + 1) {
                  return (
                    <div ref={lastVideoElementRef} key={v.id} className="transform hover:scale-[1.02] transition-transform">
                      <VideoCard video={v} onClick={onVideoSelect} />
                    </div>
                  );
                } else {
                  return (
                    <div key={v.id} className="transform hover:scale-[1.02] transition-transform">
                      <VideoCard video={v} onClick={onVideoSelect} />
                    </div>
                  );
                }
              })}
              
              {isFetchingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
              )}

              {!isLoadingRelated && relatedVideos.length === 0 && (
                <p className="text-stone-500 text-center py-12 italic">
                  No related videos found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
