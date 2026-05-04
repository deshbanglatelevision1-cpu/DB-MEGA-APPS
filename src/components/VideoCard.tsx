import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { YouTubeVideo } from '../services/youtube';
import { Play, Eye, Clock, Share2, Info, X } from 'lucide-react';

interface VideoCardProps {
  video: YouTubeVideo;
  onClick: (video: YouTubeVideo) => void;
  onShare?: (e: React.MouseEvent, video: YouTubeVideo) => void;
  key?: string | number;
}

export default function VideoCard({ video, onClick, onShare }: VideoCardProps) {
  const [showInfo, setShowInfo] = useState(false);

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
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-300 border border-stone-100 relative h-full flex flex-col"
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
        
        {/* Play indicator */}
        <div className="absolute bottom-2 right-2 md:hidden p-1.5 bg-black/60 backdrop-blur-md rounded-lg">
          <Play className="w-4 h-4 text-white fill-current" />
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
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <p className="text-stone-300 text-xs leading-relaxed whitespace-pre-wrap">
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
