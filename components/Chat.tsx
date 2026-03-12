'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

interface ChatProps {
  taskId: string;
  requesterId: string;
  acceptorId: string;
}

const POLL_INTERVAL_MS = 3000;
const SOCKET_TIMEOUT_MS = 4000;

export default function Chat({ taskId, requesterId, acceptorId }: ChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/messages?taskId=${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const scrollToBottom = () => {
    if (!autoScroll) return;
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    fetchMessages();

    const socketUrl =
      typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
        : 'http://localhost:3000';

    const newSocket = io(socketUrl, {
      auth: { token },
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    const timeoutId = setTimeout(() => {
      if (!newSocket.connected) {
        console.warn('Socket did not connect in time, using REST fallback');
        setUseFallback(true);
        newSocket.close();
      }
    }, SOCKET_TIMEOUT_MS);

    newSocket.on('connect', () => {
      clearTimeout(timeoutId);
      setConnected(true);
      setUseFallback(false);
      newSocket.emit('join-task', taskId);
    });

    newSocket.on('joined-task', () => {
      fetchMessages();
    });

    newSocket.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Chat] Socket connect_error:', err.message);
      clearTimeout(timeoutId);
      setUseFallback(true);
    });

    setSocket(newSocket);

    return () => {
      clearTimeout(timeoutId);
      newSocket.emit('leave-task', taskId);
      newSocket.close();
    };
  }, [taskId, user?.id]);

  useEffect(() => {
    if (connected) return;
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [connected, taskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    // If user is within 40px of the bottom, keep auto-scroll enabled
    setAutoScroll(distanceFromBottom < 40);
  };

  const canSend = !!user;
  const otherPartyId = user?.id === requesterId ? acceptorId : requesterId;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;

    if (connected && socket) {
      socket.emit('send-message', {
        taskId,
        receiverId: otherPartyId,
        content,
      });
      setNewMessage('');
      return;
    }

    setSendLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId,
          receiverId: otherPartyId,
          content,
        }),
      });
      if (res.ok) {
        setNewMessage('');
        await fetchMessages();
      }
    } finally {
      setSendLoading(false);
    }
  };

  const isRequester = user?.id === requesterId;
  const otherPartyName = isRequester
    ? messages.find((m) => m.senderId === acceptorId)?.sender?.profile?.firstName || 'Acceptor'
    : messages.find((m) => m.senderId === requesterId)?.sender?.profile?.firstName || 'Requester';

  const statusText = connected
    ? 'Realtime'
    : useFallback
      ? 'Chat (polling)'
      : 'Connecting… (you can still send messages)';

  const statusColor = connected ? 'text-emerald-600' : useFallback ? 'text-slate-500' : 'text-amber-600';

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h3 className="text-lg font-semibold text-slate-900">Chat</h3>
        <p className="text-sm text-slate-500">Chatting with {otherPartyName}</p>
        <p className={`mt-1 text-xs font-medium ${statusColor}`}>{statusText}</p>
      </div>

      <div
        ref={containerRef}
        className="h-72 overflow-y-auto p-4 sm:h-96 sm:p-5"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center text-slate-500">
            <p>No messages yet.</p>
            <p className="mt-1 text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex animate-fade-in ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 shadow-card ${
                      isOwnMessage
                        ? 'rounded-br-md bg-primary-600 text-white'
                        : 'rounded-bl-md bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`mt-1 text-xs ${
                        isOwnMessage ? 'text-primary-100' : 'text-slate-500'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="border-t border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:text-sm"
            disabled={!canSend}
          />
          <button
            type="submit"
            disabled={!canSend || !newMessage.trim() || sendLoading}
            className="shrink-0 rounded-xl bg-primary-600 px-4 py-2.5 font-medium text-white shadow-soft transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed btn-active sm:px-5"
          >
            {sendLoading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
