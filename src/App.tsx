import React, { useState, useEffect, useCallback } from 'react';
import HomeFeed from './components/HomeFeed';
import BottomSearchBar from './components/BottomSearchBar';
import VideoPlayer from './components/VideoPlayer';
import AIChatbot from './components/AIChatbot';
import ShareModal from './components/ShareModal';
import { YouTubeVideo, searchVideos, YOUTUBE_API_KEY } from './services/youtube';
import { Play, Sparkles, User, Settings, Info, Menu, X, Bell, TrendingUp, Zap } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [searchResults, setSearchResults] = useState<YouTubeVideo[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nextSearchPageToken, setNextSearchPageToken] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'trending' | 'shorts'>('trending');
  const [sharingVideo, setSharingVideo] = useState<YouTubeVideo | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('db_media_history');
    return saved ? JSON.parse(saved) : [];
  });

  const handleTabChange = (tab: 'trending' | 'shorts') => {
    setActiveTab(tab);
    handleClearSearch();
  };

  useEffect(() => {
    localStorage.setItem('db_media_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    // Handle URL parameters for sharing (e.g., ?v=VIDEO_ID)
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('v');
    if (videoId) {
      const fetchVideo = async () => {
        try {
          const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`);
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            const item = data.items[0];
            setSelectedVideo({
              id: item.id,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.high.url,
              channelTitle: item.snippet.channelTitle,
              publishedAt: item.snippet.publishedAt,
              description: item.snippet.description,
            });
          }
        } catch (error) {
          console.error("Error fetching shared video:", error);
        }
      };
      fetchVideo();
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    const response = await searchVideos(query);
    setSearchResults(response.videos);
    setNextSearchPageToken(response.nextPageToken);
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h !== query);
      return [query, ...filtered].slice(0, 10);
    });
  }, []);

  const handleLoadMoreSearch = useCallback(async (query: string) => {
    if (!nextSearchPageToken) return;
    const response = await searchVideos(query, nextSearchPageToken);
    setSearchResults(prev => [...(prev || []), ...response.videos]);
    setNextSearchPageToken(response.nextPageToken);
  }, [nextSearchPageToken]);

  const handleDeleteHistory = useCallback((query: string) => {
    setSearchHistory(prev => prev.filter(h => h !== query));
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchResults(null);
    setSearchQuery('');
    setNextSearchPageToken(undefined);
    // Clear URL parameter when clearing search
    const url = new URL(window.location.href);
    url.searchParams.delete('v');
    window.history.replaceState({}, '', url);
  }, []);

  const handleVideoSelect = useCallback((video: YouTubeVideo) => {
    setSelectedVideo(video);
    // Update URL parameter for sharing
    const url = new URL(window.location.href);
    url.searchParams.set('v', video.id);
    window.history.replaceState({}, '', url);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setSelectedVideo(null);
    // Clear URL parameter when closing player
    const url = new URL(window.location.href);
    url.searchParams.delete('v');
    window.history.replaceState({}, '', url);
  }, []);

  const handleShare = useCallback((e: React.MouseEvent | undefined, video: YouTubeVideo) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSharingVideo(video);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-stone-100 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/20">
            <Play className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tighter leading-none mb-1">
              DB MASS MEDIA
            </h1>
            <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>By PMB SIAM</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-2xl">
            <button
              onClick={() => handleTabChange('trending')}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                activeTab === 'trending' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Video
            </button>
            <button
              onClick={() => handleTabChange('shorts')}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                activeTab === 'shorts' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              <Zap className="w-4 h-4" />
              Shorts
            </button>
          </div>
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center border border-stone-200 hover:scale-105 transition-transform cursor-pointer">
            <User className="w-6 h-6 text-stone-400" />
          </div>
        </div>
      </header>

      <main className="pt-24 min-h-screen">
        <HomeFeed 
          onVideoSelect={handleVideoSelect} 
          searchResults={searchResults}
          onClearSearch={handleClearSearch}
          searchQuery={searchQuery}
          onLoadMoreSearch={handleLoadMoreSearch}
          nextSearchPageToken={nextSearchPageToken}
          activeTab={activeTab}
          onShare={handleShare}
        />
      </main>

      <BottomSearchBar 
        onSearch={handleSearch} 
        searchHistory={searchHistory}
        onDeleteHistory={handleDeleteHistory}
      />

      <VideoPlayer 
        video={selectedVideo} 
        onClose={handleClosePlayer} 
        onVideoSelect={handleVideoSelect}
        onShare={handleShare}
      />

      <ShareModal 
        video={sharingVideo} 
        onClose={() => setSharingVideo(null)} 
      />

      <AIChatbot />

      <footer className="bg-white border-t border-stone-100 py-12 pb-40 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-stone-100 rounded-xl">
              <Play className="w-4 h-4 text-stone-400" />
            </div>
            <p className="text-stone-400 text-sm font-medium">
              &copy; 2026 DB MASS MEDIA. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <a href="#" className="text-stone-400 hover:text-stone-900 text-sm font-bold uppercase tracking-widest transition-colors">Privacy</a>
            <a href="#" className="text-stone-400 hover:text-stone-900 text-sm font-bold uppercase tracking-widest transition-colors">Terms</a>
            <a href="#" className="text-stone-400 hover:text-stone-900 text-sm font-bold uppercase tracking-widest transition-colors">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
