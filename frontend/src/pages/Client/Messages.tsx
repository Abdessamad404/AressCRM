import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { messageApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
import type { Message } from '../../types/client';

// ─── Conversations list ───────────────────────────────────────────────────────
export function ConversationsList() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageApi.getConversations,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Messages</h1>

      {(conversations?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No conversations yet</p>
          <p className="text-sm mt-1">Start by contacting an entreprise or commercial from a job offer page.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations?.map((conv) => (
            <Link
              key={conv.id}
              to={`/client/messages/${conv.id}`}
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-base shrink-0">
                {conv.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {conv.name}
                  </p>
                  {conv.last_message && (
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {new Date(conv.last_message.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {conv.client_type && (
                    <span className="capitalize mr-1">[{conv.client_type}]</span>
                  )}
                  {conv.last_message?.content ?? 'No messages yet'}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-bold shrink-0">
                  {conv.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Message Thread ───────────────────────────────────────────────────────────
export function MessageThread() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [content, setContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['message-thread', partnerId],
    queryFn: () => messageApi.getThread(partnerId!),
    refetchInterval: 5000,
    enabled: Boolean(partnerId),
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageApi.getConversations,
  });

  const partner = conversations?.find((c) => c.id === partnerId);

  const sendMutation = useMutation({
    mutationFn: (text: string) => messageApi.send({ receiver_id: partnerId!, content: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-thread', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      setContent('');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.data]);

  const handleSend = () => {
    const text = content.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4 shrink-0">
        <button onClick={() => navigate('/client/messages')} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={18} />
        </button>
        {partner ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm shrink-0">
              {partner.name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{partner.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{partner.client_type}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Conversation</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (data?.data?.length ?? 0) === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No messages yet. Say hello! 👋
          </div>
        ) : (
          <>
            {data?.data.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isMine={msg.sender_id === user?.id} />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message... (Enter to send)"
            className="flex-1 px-4 py-3 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 resize-none max-h-32"
            style={{ height: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!content.trim() || sendMutation.isPending}
            className="p-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-2xl transition-colors shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
        isMine
          ? 'bg-primary-600 text-white rounded-br-sm'
          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.job_offer && (
          <p className={`text-xs mt-1 ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
            re: {message.job_offer.title}
          </p>
        )}
        <p className={`text-xs mt-1 ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isMine && (message.is_read ? ' ✓✓' : ' ✓')}
        </p>
      </div>
    </div>
  );
}
