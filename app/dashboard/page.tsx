'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  urgency: string;
  rewardPoints: number;
  createdAt: string;
  requester: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  department: {
    name: string;
  };
}

export default function DashboardPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [acceptedTasks, setAcceptedTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const loadDashboard = async () => {
        // Refresh to ensure points/level are up to date when navigating here
        if (refreshUser) {
          await refreshUser();
        }
        await fetchTasks();
      };
      loadDashboard();
    }
  }, [user?.id, loading, router, refreshUser]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const [myRes, acceptedRes] = await Promise.all([
        fetch('/api/tasks?myTasks=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/tasks?acceptedByMe=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (myRes.ok) {
        const data = await myRes.json();
        setMyTasks(data.filter((t: Task) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'));
      }

      if (acceptedRes.ok) {
        const data = await acceptedRes.json();
        setAcceptedTasks(data.filter((t: Task) => t.status === 'ACCEPTED'));
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ELITE': return 'text-violet-600';
      case 'GOLD': return 'text-amber-600';
      case 'SILVER': return 'text-slate-600';
      case 'BRONZE': return 'text-orange-600';
      default: return 'text-slate-400';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800';
      default: return 'bg-emerald-100 text-emerald-800';
    }
  };

  const statCards = [
    { label: 'Points', value: user?.points ?? 0, icon: '💰', delay: 0 },
    { label: 'Reputation', value: user?.reputation ?? 0, icon: '⭐', delay: 1 },
    { label: 'Level', value: user?.level ?? 'NEW', valueClass: getLevelColor(user?.level ?? ''), icon: '🏆', delay: 2 },
    { label: 'Active Tasks', value: acceptedTasks.length, icon: '📋', delay: 3 },
  ];

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
          <p className="text-sm font-medium text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="px-0 sm:px-0">
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-slate-600">
              Welcome back, {user.profile?.firstName}!
            </p>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="card-hover animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-2xl">
                    {stat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className={`text-lg font-semibold text-slate-900 ${stat.valueClass ?? ''}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Task lists */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white shadow-card">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                <h2 className="text-lg font-semibold text-slate-900">My Posted Tasks</h2>
              </div>
              <div className="p-4 sm:p-6">
                {loadingTasks ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
                  </div>
                ) : myTasks.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">
                    No active tasks.{' '}
                    <Link href="/tasks/new" className="font-medium text-primary-600 hover:text-primary-700">
                      Post one now
                    </Link>
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {myTasks.slice(0, 5).map((task) => (
                      <li key={task.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/tasks/${task.id}`}
                              className="font-medium text-slate-900 transition-colors hover:text-primary-600"
                            >
                              {task.title}
                            </Link>
                            <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                              {task.description.substring(0, 100)}...
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getUrgencyColor(task.urgency)}`}>
                                {task.urgency}
                              </span>
                              <span className="text-sm text-slate-500">{task.rewardPoints} pts</span>
                            </div>
                          </div>
                          <span className="shrink-0 text-sm text-slate-500 sm:ml-4">{task.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white shadow-card">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                <h2 className="text-lg font-semibold text-slate-900">Accepted Tasks</h2>
              </div>
              <div className="p-4 sm:p-6">
                {loadingTasks ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
                  </div>
                ) : acceptedTasks.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">
                    No accepted tasks.{' '}
                    <Link href="/tasks" className="font-medium text-primary-600 hover:text-primary-700">
                      Browse tasks
                    </Link>
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {acceptedTasks.map((task) => (
                      <li key={task.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/tasks/${task.id}`}
                              className="font-medium text-slate-900 transition-colors hover:text-primary-600"
                            >
                              {task.title}
                            </Link>
                            <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                              {task.description.substring(0, 100)}...
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getUrgencyColor(task.urgency)}`}>
                                {task.urgency}
                              </span>
                              <span className="text-sm text-slate-500">{task.rewardPoints} pts</span>
                            </div>
                          </div>
                          <Link
                            href={`/tasks/${task.id}`}
                            className="shrink-0 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 sm:ml-4"
                          >
                            View
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
