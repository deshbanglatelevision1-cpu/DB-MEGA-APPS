import React, { useState, useEffect, useRef } from 'react';
import { Search, X, History, Sparkles, Loader2, ArrowRight, Trash2 } from 'lucide-react';
import { getSearchSuggestions } from '../services/youtube';
import { cn } from '../lib/utils';

interface BottomSearchBarProps {
  onSearch: (query: string) => void;
  searchHistory: string[];
  onDeleteHistory: (query: string) => void;
}

export default function BottomSearchBar({ onSearch, searchHistory, onDeleteHistory }: BottomSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        const results = await getSearchSuggestions(query);
        setSuggestions(results);
        setIsLoading(false);
      } else {
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e?: React.FormEvent, selectedQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = selectedQuery || query;
    if (finalQuery.trim()) {
      onSearch(finalQuery.trim());
      setQuery('');
      setIsExpanded(false);
    }
  };

  return (
    <>
      {isExpanded && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl animate-in fade-in duration-300 flex flex-col">
          <div className="p-6 border-b border-stone-100 flex items-center gap-4">
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-stone-600" />
            </button>
            <form onSubmit={handleSubmit} className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search global videos..."
                className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-lg font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              {isLoading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 animate-spin" />
              )}
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {suggestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-2">Suggestions</h3>
                <div className="space-y-1">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(undefined, s)}
                      className="w-full p-4 text-left hover:bg-emerald-50 rounded-2xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span className="text-stone-700 font-medium">{s}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchHistory.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-2">Recent History</h3>
                <div className="space-y-1">
                  {searchHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <button
                        onClick={() => handleSubmit(undefined, h)}
                        className="flex-1 p-4 text-left hover:bg-stone-50 rounded-2xl flex items-center gap-4 transition-all"
                      >
                        <History className="w-4 h-4 text-stone-400" />
                        <span className="text-stone-600 font-medium">{h}</span>
                      </button>
                      <button 
                        onClick={() => onDeleteHistory(h)}
                        className="p-3 hover:bg-rose-50 text-stone-300 hover:text-rose-500 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-6 z-30 pointer-events-none flex justify-center">
        <button
          onClick={() => setIsExpanded(true)}
          className="pointer-events-auto w-full max-w-2xl h-16 bg-white/80 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl flex items-center px-6 gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group ring-1 ring-black/5"
        >
          <div className="p-2 bg-emerald-600 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-emerald-600/20">
            <Search className="w-5 h-5 text-white" />
          </div>
          <span className="text-stone-400 font-medium text-lg flex-1 text-left">
            Global Video Search...
          </span>
          <div className="flex items-center gap-2 text-[10px] font-bold text-stone-300 uppercase tracking-widest bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>AI Search</span>
          </div>
        </button>
      </div>
    </>
  );
}
