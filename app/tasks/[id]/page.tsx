'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Chat from '@/components/Chat';
import RatingForm from '@/components/RatingForm';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  urgency: string;
  rewardPoints: number;
  createdAt: string;
  locationText?: string;
  imageUrl?: string;
  requesterCompleted: boolean;
  acceptorCompleted: boolean;
  requester: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  acceptor?: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  department: {
    name: string;
  };
  ratings?: Array<{
    giverId: string;
    receiverId: string;
  }>;
}

export default function TaskDetailPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChatHint, setShowChatHint] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && params.id) {
      fetchTask();
    }
  }, [user, loading, router, params.id]);

  const fetchTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setError(null);
        if (
          (data.status === 'ACCEPTED' || data.status === 'COMPLETED') &&
          user &&
          (data.requester.id === user.id || data.acceptor?.id === user.id)
        ) {
          setShowChatHint(true);
        } else {
          setShowChatHint(false);
        }
      } else if (res.status === 401) {
        router.push('/login');
      } else if (res.status === 403) {
        setError('You do not have access to view this task.');
      } else {
        setError('Task not found');
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoadingTask(false);
    }
  };

  useEffect(() => {
    if (!user || !params.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    let socketUrl = '';
    if (typeof window !== 'undefined') {
      socketUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    }

    const { io } = require('socket.io-client');
    const socket = io(socketUrl, {
      auth: { token },
      path: '/socket.io',
      transports: ['polling', 'websocket'],
    });

    socket.on('connect', () => {
      socket.emit('join-task', params.id);
    });

    socket.on('task-completed', async (updatedTask: Task) => {
      setTask(updatedTask);
      await refreshUser();
      // Remove alert to ensure immediate redirection for the passive user
      router.push('/');
    });

    return () => {
      socket.emit('leave-task', params.id);
      socket.close();
    };
  }, [user, params.id, refreshUser, router]);

  const handleAccept = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${task.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchTask();
        setShowChatHint(true);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to accept task');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to accept task. Check console for details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const updated = await res.json();
        setTask(updated);
        // If this call resulted in the task being fully completed and the current user is the worker,
        // refresh auth so points/reputation update instantly in the UI.
        if (updated.status === 'COMPLETED') {
          await refreshUser();
          router.push('/');
        } else {
          alert('Completion recorded. Once both sides confirm, rewards will be applied.');
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to complete task');
      }
    } catch (error) {
      alert('Failed to complete task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to cancel this task?')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${task.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        router.push('/tasks');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to cancel task');
      }
    } catch (error) {
      alert('Failed to cancel task');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || loadingTask) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
          <p className="text-sm text-slate-500">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-card">
            <h3 className="text-xl font-semibold text-slate-900">Task Not Found</h3>
            <p className="mt-2 text-slate-500">{error || 'This task may have been removed or does not exist.'}</p>
            <Link
              href="/tasks"
              className="mt-6 inline-flex items-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-700"
            >
              Back to Tasks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRequester = user && task.requester.id === user.id;
  const isAcceptor = user && task.acceptor?.id === user.id;
  const canAccept = task.status === 'OPEN' && !isRequester;
  const canComplete =
    task.status === 'ACCEPTED' &&
    ((isRequester && !task.requesterCompleted) || (isAcceptor && !task.acceptorCompleted));
  const showChat = (task.status === 'ACCEPTED' || task.status === 'COMPLETED') && (isRequester || isAcceptor);

  const urgencyClass =
    task.urgency === 'HIGH' ? 'bg-red-100 text-red-800' :
    task.urgency === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="px-0 sm:px-0">
          <Link
            href="/tasks"
            className="mb-4 inline-flex items-center text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            ← Back to Tasks
          </Link>

          <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{task.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${urgencyClass}`}>
                    {task.urgency}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                    {task.category}
                  </span>
                  <span className="text-sm text-slate-500">{task.department.name}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start md:items-end">
                <div className="text-2xl font-bold text-primary-600">{task.rewardPoints} pts</div>
                <div className="mt-1 text-sm font-medium uppercase tracking-wider text-slate-500">{task.status}</div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">{task.description}</p>
            </div>

            {(task.locationText || task.imageUrl) && (
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                {task.locationText && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Location</h2>
                    <p className="mt-2 text-slate-700">{task.locationText}</p>
                  </div>
                )}
                {task.imageUrl && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Image</h2>
                    <img src={task.imageUrl} alt={task.title} className="mt-2 max-w-full rounded-xl object-cover shadow-card" />
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4 rounded-xl border-t border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-sm text-slate-500">Posted by</p>
                  <p className="font-medium text-slate-900">
                    {task.requester.profile.firstName} {task.requester.profile.lastName}
                    {isRequester && <span className="ml-1 text-xs font-medium text-primary-600">(You)</span>}
                  </p>
                  {isRequester && task.status === 'ACCEPTED' && (
                    <p className="mt-1 text-xs text-slate-500">
                      {task.requesterCompleted
                        ? task.acceptorCompleted
                          ? 'Both sides have confirmed completion.'
                          : 'You have confirmed completion. Waiting for the helper to confirm.'
                        : 'Confirm completion once the task is done. Both sides must confirm.'}
                    </p>
                  )}
                </div>
                {task.acceptor && (
                  <div>
                    <p className="text-sm text-slate-500">Accepted by</p>
                    <p className="font-medium text-slate-900">
                      {task.acceptor.profile.firstName} {task.acceptor.profile.lastName}
                      {isAcceptor && <span className="ml-1 text-xs font-medium text-primary-600">(You)</span>}
                    </p>
                    {isAcceptor && task.status === 'ACCEPTED' && (
                      <p className="mt-1 text-xs text-slate-500">
                        {task.acceptorCompleted
                          ? task.requesterCompleted
                            ? 'Both sides have confirmed completion.'
                            : 'You have confirmed completion. Waiting for the poster to confirm.'
                          : 'Confirm completion once you have finished the task. Both sides must confirm.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {canAccept && (
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    className="rounded-xl bg-primary-600 px-6 py-2.5 font-medium text-white shadow-soft transition hover:bg-primary-700 disabled:opacity-50 btn-active"
                  >
                    Accept Task
                  </button>
                )}
                {canComplete && (
                  <button
                    onClick={handleComplete}
                    disabled={actionLoading}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 font-medium text-white shadow-soft transition hover:bg-emerald-700 disabled:opacity-50 btn-active"
                  >
                    Mark Complete
                  </button>
                )}
                {(isRequester || isAcceptor) && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="rounded-xl border border-red-200 bg-white px-6 py-2.5 font-medium text-red-700 shadow-card transition hover:bg-red-50 disabled:opacity-50 btn-active"
                  >
                    Cancel Task
                  </button>
                )}
              </div>
            </div>
          </div>

          {showChat && (
            <div className="mt-8 animate-fade-in-up">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Task Chat</h2>
              {showChatHint && (
                <div className="mb-4 flex gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <div className="shrink-0 text-sky-500">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-sky-800">
                    You can now chat with {isRequester ? task.acceptor?.profile.firstName : task.requester.profile.firstName} to coordinate this task.
                  </p>
                </div>
              )}
              <Chat
                taskId={task.id}
                requesterId={task.requester.id}
                acceptorId={task.acceptor?.id || ''}
              />
            </div>
          )}

          {task.status === 'COMPLETED' && task.acceptor && (
            <div className="mt-8 animate-fade-in-up">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Ratings</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {isRequester && (!task.ratings || !task.ratings.some(r => r.giverId === user?.id && r.receiverId === task.acceptor!.id)) && (
                  <RatingForm
                    taskId={task.id}
                    receiverId={task.acceptor.id}
                    receiverName={`${task.acceptor.profile.firstName} ${task.acceptor.profile.lastName}`}
                    onRated={() => fetchTask()}
                  />
                )}
                {isAcceptor && (!task.ratings || !task.ratings.some(r => r.giverId === user?.id && r.receiverId === task.requester.id)) && (
                  <RatingForm
                    taskId={task.id}
                    receiverId={task.requester.id}
                    receiverName={`${task.requester.profile.firstName} ${task.requester.profile.lastName}`}
                    onRated={() => fetchTask()}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
