import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Globe, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { chatWithAI, ChatMessage } from '../services/aiService';
import { cn } from '../lib/utils';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithAI([...messages, userMessage]);
      const aiMessage: ChatMessage = { role: 'model', text: response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "Sorry, I'm having trouble connecting right now. Please check if your GEMINI_API_KEY is configured." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isOpen) setIsMaximized(false);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={toggleOpen}
        className={cn(
          "fixed bottom-24 right-6 p-4 rounded-full shadow-2xl transition-all duration-500 z-[100] group",
          isOpen 
            ? "bg-rose-500 hover:bg-rose-600 rotate-90" 
            : "bg-emerald-600 hover:bg-emerald-700 hover:scale-110 active:scale-95"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-emerald-600 animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed transition-all duration-500 ease-in-out bg-white rounded-[32px] shadow-2xl border border-stone-100 flex flex-col overflow-hidden z-[100] animate-in slide-in-from-bottom-8 zoom-in-95",
          isMaximized 
            ? "inset-4 md:inset-10 max-w-none max-h-none h-auto w-auto" 
            : "bottom-32 right-6 w-[90vw] max-w-[400px] h-[60vh] max-h-[600px]"
        )}>
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-sm tracking-tight leading-none mb-1">AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                  <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                title={isMaximized ? "Minimize" : "Maximize"}
              >
                {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => toggleOpen()}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-stone-50/50">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center">
                  <Bot className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-stone-900 font-bold">How can I help?</h4>
                  <p className="text-stone-400 text-xs px-8 leading-relaxed">
                    Ask me about videos, search the web, or just chat with our new AI engine.
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-end gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'user' ? "bg-stone-900" : "bg-emerald-600"
                )}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-stone-900 text-white rounded-br-none" 
                    : "bg-white text-stone-800 border border-stone-100 rounded-bl-none"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center animate-pulse">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-stone-100 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-200 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-stone-100">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask AI anything..."
                className="w-full bg-stone-100 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none pr-14"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-all active:scale-90"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-4 px-2">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-stone-400" />
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Web Search Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-stone-400" />
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Rendering v3.1</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
