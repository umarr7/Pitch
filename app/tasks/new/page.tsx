'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { z } from 'zod';

interface Department {
  id: string;
  name: string;
  code: string;
}

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title matches max length of 200'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description matches max length of 2000'),
  category: z.enum(['ERRAND', 'LOST', 'BOOK', 'TUTORING', 'OTHER']),
  departmentId: z.string().min(1, 'Department is required'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  rewardPoints: z.number().int().min(1, 'Points must be at least 1').max(100, 'Points cannot exceed 100'),
  locationText: z.string().optional(),
  imageUrl: z.string().optional(),
});

type TaskFormData = z.infer<typeof createTaskSchema>;

export default function NewTaskPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    category: 'ERRAND',
    departmentId: '',
    urgency: 'MEDIUM',
    rewardPoints: 15,
    locationText: '',
    imageUrl: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      if (user.level === 'NEW') {
        alert('You need to reach Bronze level to post tasks. Complete tasks to earn reputation!');
        router.push('/tasks');
        return;
      }
      fetchDepartments();
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.department?.id) {
      setFormData((prev) => ({ ...prev, departmentId: user.department!.id }));
    }
  }, [user]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
        if (!formData.departmentId && data.length > 0 && !user?.department?.id) {
          setFormData((prev) => ({ ...prev, departmentId: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const validateForm = (): boolean => {
    try {
      createTaskSchema.parse(formData);
      setFieldErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof TaskFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof TaskFormData] = err.message;
          }
        });
        setFieldErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      setGeneralError('Please fix the errors below.');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...formData,
        imageUrl: formData.imageUrl === '' ? undefined : formData.imageUrl,
        locationText: formData.locationText === '' ? undefined : formData.locationText,
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        const task = await res.json();
        router.push(`/tasks/${task.id}`);
      } else {
        const errorData = await res.json();
        if (errorData.details) {
          const errors: Partial<Record<keyof TaskFormData, string>> = {};
          errorData.details.forEach((err: any) => {
            if (err.path[0]) {
              errors[err.path[0] as keyof TaskFormData] = err.message;
            }
          });
          setFieldErrors(errors);
          setGeneralError('Invalid input. Please check the fields.');
        } else {
          setGeneralError(errorData.error || 'Failed to create task');
        }
      }
    } catch (error) {
      setGeneralError('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = 'block w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 sm:text-sm';
  const inputError = 'border-red-300 focus:border-red-500 focus:ring-red-500/20';
  const inputNormal = 'border-slate-300 focus:border-primary-500 focus:ring-primary-500/20';

  const inputClassName = (fieldName: keyof TaskFormData) =>
    `${inputBase} ${fieldErrors[fieldName] ? inputError : inputNormal}`;

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
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="px-0 sm:px-0">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Create New Task
          </h1>

          <form
            onSubmit={handleSubmit}
            className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6 lg:p-8"
          >
            {generalError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {generalError}
              </div>
            )}

            <div className="space-y-5 sm:space-y-6">
              <div>
                <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  maxLength={200}
                  className={inputClassName('title')}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                {fieldErrors.title && <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>}
              </div>

              <div>
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={6}
                  maxLength={2000}
                  className={inputClassName('description')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                {fieldErrors.description && <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
                    Category *
                  </label>
                  <select
                    id="category"
                    required
                    className={inputClassName('category')}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskFormData['category'] })}
                  >
                    <option value="ERRAND">Errand</option>
                    <option value="LOST">Lost & Found</option>
                    <option value="BOOK">Book Exchange</option>
                    <option value="TUTORING">Tutoring</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {fieldErrors.category && <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>}
                </div>
                <div>
                  <label htmlFor="departmentId" className="mb-1 block text-sm font-medium text-slate-700">
                    Department *
                  </label>
                  <select
                    id="departmentId"
                    required
                    className={inputClassName('departmentId')}
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.departmentId && <p className="mt-1 text-sm text-red-600">{fieldErrors.departmentId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="urgency" className="mb-1 block text-sm font-medium text-slate-700">
                    Urgency *
                  </label>
                  <select
                    id="urgency"
                    required
                    className={inputClassName('urgency')}
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as TaskFormData['urgency'] })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  {fieldErrors.urgency && <p className="mt-1 text-sm text-red-600">{fieldErrors.urgency}</p>}
                </div>
                <div>
                  <label htmlFor="rewardPoints" className="mb-1 block text-sm font-medium text-slate-700">
                    Reward Points *
                  </label>
                  <input
                    type="number"
                    id="rewardPoints"
                    required
                    min={1}
                    max={100}
                    className={inputClassName('rewardPoints')}
                    value={formData.rewardPoints}
                    onChange={(e) => setFormData({ ...formData, rewardPoints: parseInt(e.target.value) || 0 })}
                  />
                  <p className="mt-1 text-sm text-slate-500">You will pay 10 points to post this task</p>
                  {fieldErrors.rewardPoints && <p className="mt-1 text-sm text-red-600">{fieldErrors.rewardPoints}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="locationText" className="mb-1 block text-sm font-medium text-slate-700">
                  Location <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  id="locationText"
                  className={inputClassName('locationText')}
                  value={formData.locationText}
                  onChange={(e) => setFormData({ ...formData, locationText: e.target.value })}
                />
                {fieldErrors.locationText && <p className="mt-1 text-sm text-red-600">{fieldErrors.locationText}</p>}
              </div>

              <div>
                <label htmlFor="image" className="mb-1 block text-sm font-medium text-slate-700">
                  Image <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingImage(true);
                    setFieldErrors((prev) => ({ ...prev, imageUrl: undefined }));
                    try {
                      const form = new FormData();
                      form.append('file', file);
                      const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: form,
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        setFieldErrors((prev) => ({
                          ...prev,
                          imageUrl: err.error || 'Failed to upload image',
                        }));
                        return;
                      }
                      const { url } = await res.json();
                      setFormData((prev) => ({ ...prev, imageUrl: url }));
                    } catch {
                      setFieldErrors((prev) => ({
                        ...prev,
                        imageUrl: 'Failed to upload image',
                      }));
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
                {uploadingImage && (
                  <p className="mt-1 text-xs text-slate-500">Uploading image...</p>
                )}
                {formData.imageUrl && !fieldErrors.imageUrl && (
                  <div className="mt-2">
                    <p className="mb-1 text-xs font-medium text-slate-500">Preview</p>
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="max-h-40 rounded-lg border border-slate-200 object-cover"
                    />
                  </div>
                )}
                {fieldErrors.imageUrl && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.imageUrl}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-700 disabled:opacity-50 btn-active"
              >
                {submitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
