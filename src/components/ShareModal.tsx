import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Facebook, Twitter, Linkedin, ExternalLink, Mail, Link as LinkIcon, Copy, Check, Sparkles } from 'lucide-react';
import { YouTubeVideo } from '../services/youtube';
import { cn } from '../lib/utils';

interface ShareModalProps {
  video: YouTubeVideo | null;
  onClose: () => void;
}

export default function ShareModal({ video, onClose }: ShareModalProps) {
  const [toast, setToast] = useState<string | null>(null);

  if (!video) return null;

  const copyToClipboard = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?v=${video.id}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setToast('Link copied to clipboard!');
        setTimeout(() => setToast(null), 3000);
      } else {
        throw new Error('Clipboard not supported');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      setToast('Failed to copy link');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const shareToSocial = (platform: string) => {
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
      case 'reddit':
        url = `https://www.reddit.com/submit?url=${shareUrl}&title=${text}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
      case 'email':
        url = `mailto:?subject=${text}&body=${shareUrl}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xl" onClick={onClose} />
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[400] animate-in fade-in slide-in-from-top-4">
          <div className="px-6 py-3 bg-stone-900 text-white rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 border border-white/10">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {toast}
          </div>
        </div>
      )}

      <div className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 space-y-8 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-rose-500 to-emerald-500 animate-gradient-x" />
         
         <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-stone-900 tracking-tight mb-1">Share Media</h3>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Select Platform</p>
          </div>
          <button onClick={onClose} className="p-3 bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-500 rounded-2xl transition-all">
            <X className="w-5 h-5" />
          </button>
         </div>

         <div className="grid grid-cols-2 gap-3">
           <button onClick={() => shareToSocial('whatsapp')} className="h-14 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-2xl flex items-center justify-center gap-3 font-bold transition-all group">
             <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span className="text-xs">WhatsApp</span>
           </button>
           <button onClick={() => shareToSocial('facebook')} className="h-14 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-2xl flex items-center justify-center gap-3 font-bold transition-all group">
             <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span className="text-xs">Facebook</span>
           </button>
           <button onClick={() => shareToSocial('twitter')} className="h-14 bg-stone-900/10 hover:bg-stone-900/20 text-stone-900 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all group">
             <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span className="text-xs">Twitter</span>
           </button>
           <button onClick={() => shareToSocial('linkedin')} className="h-14 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] rounded-2xl flex items-center justify-center gap-3 font-bold transition-all group">
             <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span className="text-xs">LinkedIn</span>
           </button>
           <button onClick={() => shareToSocial('reddit')} className="h-14 bg-[#FF4500]/10 hover:bg-[#FF4500]/20 text-[#FF4500] rounded-2xl flex items-center justify-center gap-3 font-bold transition-all group">
             <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span className="text-xs">Reddit</span>
           </button>
           <button onClick={() => shareToSocial('email')} className="h-14 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all group">
             <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span className="text-xs">Email</span>
           </button>
         </div>

         <div className="pt-4 border-t border-stone-100">
           <button 
             onClick={copyToClipboard} 
             className={cn(
               "w-full h-14 rounded-2xl flex items-center justify-between px-6 font-bold transition-all group",
               toast?.includes('copied') ? "bg-emerald-500 text-white" : "bg-stone-100 hover:bg-stone-200 text-stone-900"
             )}
           >
             <div className="flex items-center gap-4">
               {toast?.includes('copied') ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5 text-stone-400" />}
               <span>{toast?.includes('copied') ? 'Copied' : 'Copy Video Link'}</span>
             </div>
             {!toast?.includes('copied') && <Copy className="w-4 h-4 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
           </button>
         </div>
      </div>
    </div>
  );
}
