'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  reputation: number;
  points: number;
  level: string;
  department?: {
    name: string;
    code: string;
  };
  tasksCompleted: number;
  reputationChange?: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [type, setType] = useState<'all-time' | 'weekly' | 'department'>('all-time');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchDepartments();
      fetchLeaderboard();
    }
  }, [user, loading, router, type, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('type', type);
      if (type === 'department' && selectedDepartment) {
        params.append('departmentId', selectedDepartment);
      }

      const res = await fetch(`/api/leaderboard?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ELITE': return 'bg-violet-100 text-violet-700';
      case 'GOLD': return 'bg-amber-100 text-amber-700';
      case 'SILVER': return 'bg-slate-100 text-slate-700';
      case 'BRONZE': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const typeButtons: { id: typeof type; label: string }[] = [
    { id: 'all-time', label: 'All Time' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'department', label: 'Department' },
  ];

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="px-0 sm:px-0">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Leaderboard
          </h1>

          {/* Filters */}
          <div className="mb-6 animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex flex-wrap gap-2">
                {typeButtons.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setType(btn.id)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition btn-active ${
                      type === btn.id
                        ? 'bg-primary-600 text-white shadow-soft'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              {type === 'department' && (
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Leaderboard - card on mobile, table on desktop */}
          {loadingLeaderboard ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
              <p className="mt-4 text-sm text-slate-500">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-card">
              <p className="text-slate-500">No leaderboard data available.</p>
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="space-y-3 sm:hidden">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`animate-fade-in-up rounded-2xl border p-4 shadow-card ${
                      entry.userId === user.id ? 'border-primary-200 bg-primary-50/50' : 'border-slate-200/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-900">{getRankBadge(entry.rank)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getLevelColor(entry.level)}`}>
                        {entry.level}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-slate-900">
                      {entry.firstName && entry.lastName ? `${entry.firstName} ${entry.lastName}` : entry.email}
                    </p>
                    <p className="text-xs text-slate-500">{entry.email}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <span className="text-slate-600">{entry.reputation} rep</span>
                      <span className="text-slate-600">{entry.points} pts</span>
                      <span className="text-slate-600">{entry.tasksCompleted} tasks</span>
                      {type === 'weekly' && entry.reputationChange !== undefined && (
                        <span className={entry.reputationChange >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {entry.reputationChange >= 0 ? '+' : ''}{entry.reputationChange}
                        </span>
                      )}
                    </div>
                    {entry.department?.name && (
                      <p className="mt-1 text-xs text-slate-500">{entry.department.name}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card sm:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Level
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Reputation
                      </th>
                      {type === 'weekly' && (
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                          Change
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Points
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Tasks
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Department
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.userId}
                        className={entry.userId === user.id ? 'bg-primary-50/50' : ''}
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-900 sm:px-6">
                          {getRankBadge(entry.rank)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                          <div className="text-sm font-medium text-slate-900">
                            {entry.firstName && entry.lastName ? `${entry.firstName} ${entry.lastName}` : entry.email}
                          </div>
                          <div className="text-sm text-slate-500">{entry.email}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getLevelColor(entry.level)}`}>
                            {entry.level}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900 sm:px-6">
                          {entry.reputation}
                        </td>
                        {type === 'weekly' && (
                          <td className="whitespace-nowrap px-4 py-4 text-sm sm:px-6">
                            {entry.reputationChange !== undefined && (
                              <span className={entry.reputationChange >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                {entry.reputationChange >= 0 ? '+' : ''}{entry.reputationChange}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900 sm:px-6">
                          {entry.points}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900 sm:px-6">
                          {entry.tasksCompleted}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 sm:px-6">
                          {entry.department?.name || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
