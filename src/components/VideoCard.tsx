import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { YouTubeVideo } from '../services/youtube';
import { Play, Eye, Clock, Share2 } from 'lucide-react';

interface VideoCardProps {
  video: YouTubeVideo;
  onClick: (video: YouTubeVideo) => void;
  onShare?: (e: React.MouseEvent, video: YouTubeVideo) => void;
  key?: string | number;
}

export default function VideoCard({ video, onClick, onShare }: VideoCardProps) {
  const formatViews = (views?: string) => {
    if (!views) return null;
    const num = parseInt(views);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
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
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-300 border border-stone-100 relative"
    >
      <div className="relative aspect-video overflow-hidden bg-stone-100">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-full transform scale-90 md:group-hover:scale-100 transition-transform">
            <Play className="w-8 h-8 text-white fill-current" />
          </div>
        </div>
        {/* Mobile play indicator - always visible or simpler */}
        <div className="absolute bottom-2 right-2 md:hidden p-1.5 bg-black/60 backdrop-blur-md rounded-lg">
          <Play className="w-4 h-4 text-white fill-current" />
        </div>

        {/* Share Button Overlay */}
        <button 
          onClick={handleShare}
          className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all border border-white/10 z-10"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-stone-900 text-sm line-clamp-2 mb-2 leading-snug group-hover:text-emerald-600 transition-colors">
          {video.title}
        </h3>
        
        <div className="flex items-center gap-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
          <div className="flex-1 truncate">
            {video.channelTitle}
          </div>
          {video.viewCount && (
            <div className="flex items-center gap-1 shrink-0">
              <Eye className="w-3 h-3" />
              <span>{formatViews(video.viewCount)}</span>
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
