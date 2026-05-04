import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { YouTubeVideo } from '../services/youtube';
import { Play, Eye, Clock, Share2, Info, X, ThumbsUp, MessageSquare, Heart } from 'lucide-react';
import { useLikes } from '../hooks/useLikes';
import { cn } from '../lib/utils';

interface VideoCardProps {
  video: YouTubeVideo;
  onClick: (video: YouTubeVideo) => void;
  onShare?: (e: React.MouseEvent, video: YouTubeVideo) => void;
  key?: string | number;
}

export default function VideoCard({ video, onClick, onShare }: VideoCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { isLiked, toggleLike } = useLikes();
  const liked = isLiked(video.id);

  const formatNumber = (numStr?: string) => {
    if (!numStr) return null;
    const num = parseInt(numStr);
    if (isNaN(num)) return null;
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(video);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShare) {
      onShare(e, video);
    }
  };

  const handleInfoToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowInfo(!showInfo);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Recently';
      return formatDistanceToNow(date) + ' ago';
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-500/30 active:scale-[0.98] transition-all duration-500 border border-stone-100 relative h-full flex flex-col"
    >
      <div className="relative aspect-video overflow-hidden bg-stone-100">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-110 transition-all duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-full transform scale-90 md:group-hover:scale-100 transition-transform">
            <Play className="w-8 h-8 text-white fill-current" />
          </div>
        </div>
        
        {/* Play indicator & Duration */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {video.duration && (
            <div className="px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] font-bold text-white shadow-lg border border-white/10">
              {video.duration}
            </div>
          )}
          <div className="md:hidden p-1.5 bg-black/60 backdrop-blur-md rounded-lg">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
        </div>

        {/* Top Controls */}
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          <button 
            onClick={handleInfoToggle}
            className="p-2 bg-black/40 hover:bg-emerald-600 backdrop-blur-md rounded-full text-white transition-all border border-white/10"
            title="Video Information"
          >
            <Info className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleLike(video.id);
            }}
            className={cn(
              "p-2 backdrop-blur-md rounded-full transition-all border border-white/10",
              liked 
                ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20" 
                : "bg-black/40 hover:bg-rose-500 text-white"
            )}
            title={liked ? "Unlike" : "Like"}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
          </button>
          <button 
            onClick={handleShare}
            className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all border border-white/10"
            title="Share Video"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Info Overlay Panel */}
        {showInfo && (
          <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-md p-4 animate-in fade-in slide-in-from-bottom-4 duration-300 z-20 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <Info className="w-3 h-3 text-emerald-500" />
                About Video
              </h4>
              <button 
                onClick={handleInfoToggle}
                className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mt-2">
              <p className="text-stone-300 text-xs leading-relaxed md:leading-loose whitespace-pre-wrap">
                {video.description || 'No description available for this video.'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <h3 className="font-bold text-stone-900 text-sm line-clamp-2 mb-3 leading-snug group-hover:text-emerald-600 transition-colors">
          {video.title}
        </h3>
        
        <div className="flex items-center gap-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-auto pt-3 border-t border-stone-50">
          <div className="flex-1 truncate">
            {video.channelTitle}
          </div>
          {video.viewCount && (
            <div className="flex items-center gap-1 shrink-0" title="Views">
              <Eye className="w-3 h-3" />
              <span>{formatNumber(video.viewCount)}</span>
            </div>
          )}
          {video.likeCount && (
            <div className="flex items-center gap-1 shrink-0" title="Likes">
              <ThumbsUp className="w-3 h-3" />
              <span>{formatNumber(video.likeCount)}</span>
            </div>
          )}
          {video.commentCount && (
            <div className="flex items-center gap-1 shrink-0" title="Comments">
              <MessageSquare className="w-3 h-3" />
              <span>{formatNumber(video.commentCount)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            <span>{formatDate(video.publishedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
