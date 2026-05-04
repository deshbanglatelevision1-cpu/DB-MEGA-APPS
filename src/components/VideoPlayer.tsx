import React, { useEffect, useState, useRef, useCallback } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { X, Maximize, Minimize, Share2, Info, Loader2, Sparkles } from 'lucide-react';
import { YouTubeVideo, getRelatedVideos } from '../services/youtube';
import VideoCard from './VideoCard';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
  video: YouTubeVideo | null;
  onClose: () => void;
  onVideoSelect: (video: YouTubeVideo) => void;
}

export default function VideoPlayer({ video, onClose, onVideoSelect }: VideoPlayerProps) {
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
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
    },
  };

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    // Ensure the video plays immediately on the first click
    event.target.playVideo();
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
                    onClick={() => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?v=${video.id}`;
                      if (navigator.share) {
                        navigator.share({ title: video.title, url: shareUrl }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        alert('Link copied to clipboard!');
                      }
                    }}
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
