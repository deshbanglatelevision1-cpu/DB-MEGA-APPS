import { useState, useEffect } from 'react';

const LIKES_STORAGE_KEY = 'db_media_likes';

export function useLikes() {
  const [likedVideoIds, setLikedVideoIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(LIKES_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      console.error('Failed to load likes from localStorage', e);
      return new Set();
    }
  });

  const toggleLike = (videoId: string) => {
    setLikedVideoIds(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(Array.from(next)));
      
      // Dispatch a custom event to notify other instances
      window.dispatchEvent(new CustomEvent('likes-updated', { detail: next }));
      
      return next;
    });
  };

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Set<string>>;
      setLikedVideoIds(customEvent.detail);
    };

    window.addEventListener('likes-updated', handleUpdate);
    return () => window.removeEventListener('likes-updated', handleUpdate);
  }, []);

  const isLiked = (videoId: string) => likedVideoIds.has(videoId);

  return { isLiked, toggleLike };
}
