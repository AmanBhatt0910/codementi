'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatMessage, Session } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (content: string) => void;
  session: Session;
}

export function ChatPanel({ messages, currentUserId, onSend, session }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content) return;
    onSend(content);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-900/50">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/6">
        <MessageSquare size={14} className="text-brand-400" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Chat</span>
        <span className="ml-auto text-xs text-white/25">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <MessageSquare size={24} className="text-white/15" />
            <p className="text-xs text-white/25">No messages yet.<br />Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isOwn = msg.senderId === currentUserId;
              const showName = i === 0 || messages[i - 1]?.senderId !== msg.senderId;

              return (
                <motion.div
                  key={`${msg.sessionId}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={clsx('flex flex-col', isOwn ? 'items-end' : 'items-start', !showName && 'mt-0.5')}
                >
                  {showName && (
                    <div className={clsx(
                      'flex items-center gap-1.5 mb-1 px-1',
                      isOwn ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      <div className={clsx(
                        'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                        msg.senderRole === 'MENTOR'
                          ? 'bg-brand-500/30 text-brand-300'
                          : 'bg-violet-500/30 text-violet-300'
                      )}>
                        {msg.senderName.charAt(0).toUpperCase()}
                      </div>
                      <span className={clsx(
                        'text-xs font-medium',
                        msg.senderRole === 'MENTOR' ? 'text-brand-300' : 'text-violet-300'
                      )}>
                        {msg.senderName}
                      </span>
                      <span className="text-xs text-white/20">
                        {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : ''}
                      </span>
                    </div>
                  )}
                  <div className={clsx(
                    'max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed break-words',
                    isOwn
                      ? 'bg-brand-500/25 text-brand-100 rounded-tr-sm'
                      : 'bg-white/6 text-white/85 rounded-tl-sm'
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/6">
        {session.status === 'ENDED' ? (
          <div className="text-center text-xs text-white/25 py-2">Session ended</div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:bg-white/7 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-10 h-10 flex items-center justify-center bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
