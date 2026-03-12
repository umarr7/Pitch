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
    code: string;
  };
  isFeatured: boolean;
  isBoosted: boolean;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

type TabType = 'feed' | 'active' | 'my-posts';

export default function TasksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchDepartments();
      fetchTasks();
    }
  }, [user, loading, router, selectedDepartment, selectedCategory, activeTab]);

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

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (selectedDepartment) params.append('departmentId', selectedDepartment);
      if (selectedCategory) params.append('category', selectedCategory);

      if (activeTab === 'feed') {
        params.append('status', 'OPEN');
      } else if (activeTab === 'active') {
        params.append('acceptedByMe', 'true');
        params.append('status', 'ACCEPTED');
      } else if (activeTab === 'my-posts') {
        params.append('myTasks', 'true');
      }

      const res = await fetch(`/api/tasks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800';
      default: return 'bg-emerald-100 text-emerald-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ERRAND': return 'bg-sky-100 text-sky-800';
      case 'LOST': return 'bg-violet-100 text-violet-800';
      case 'BOOK': return 'bg-emerald-100 text-emerald-800';
      case 'TUTORING': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'feed', label: 'Available Tasks' },
    { id: 'active', label: 'Active Tasks' },
    { id: 'my-posts', label: 'My Posts' },
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Task Feed
            </h1>
            <Link
              href="/tasks/new"
              className="inline-flex w-full justify-center items-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto btn-active"
            >
              + New Task
            </Link>
          </div>

          {/* Tabs - scroll on mobile */}
          <div className="mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <nav className="flex min-w-max gap-1 border-b border-slate-200 sm:gap-2" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-medium transition-colors sm:px-4 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Filters */}
          <div className="mb-6 animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:text-sm"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="ERRAND">Errand</option>
                  <option value="LOST">Lost & Found</option>
                  <option value="BOOK">Book Exchange</option>
                  <option value="TUTORING">Tutoring</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDepartment('');
                    setSelectedCategory('');
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Task List */}
          {loadingTasks ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
              <p className="mt-4 text-sm text-slate-500">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-card">
              <p className="text-slate-500">
                {activeTab === 'feed'
                  ? 'No available tasks found.'
                  : activeTab === 'active'
                  ? "You haven't accepted any tasks yet."
                  : "You haven't posted any tasks yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {tasks.map((task, i) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="card-hover animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-all hover:border-slate-200 sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {task.isFeatured && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            ⭐ Featured
                          </span>
                        )}
                        {task.isBoosted && (
                          <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                            🚀 Boosted
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getUrgencyColor(task.urgency)}`}>
                          {task.urgency}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">{task.title}</h3>
                      <p className="mt-1 line-clamp-2 text-slate-600 sm:line-clamp-3">{task.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>By {task.requester.profile.firstName} {task.requester.profile.lastName}</span>
                        <span>·</span>
                        <span>{task.department.name}</span>
                        <span>·</span>
                        <span className="font-medium text-primary-600">{task.rewardPoints} points</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 sm:ml-4">
                      <div className="text-sm text-slate-500">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        task.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
