'use client';

import { useState } from 'react';

interface RatingFormProps {
  taskId: string;
  receiverId: string;
  receiverName: string;
  onRated: () => void;
}

export default function RatingForm({ taskId, receiverId, receiverName, onRated }: RatingFormProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hoverScore, setHoverScore] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId,
          receiverId,
          score,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.ok) {
        onRated();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to submit rating');
      }
    } catch (error) {
      setError('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-5"
    >
      <h4 className="mb-3 text-sm font-semibold text-slate-900">
        Rate {receiverName}
      </h4>
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      <div className="mb-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScore(value)}
              onMouseEnter={() => setHoverScore(value)}
              onMouseLeave={() => setHoverScore(0)}
              className={`rounded-lg p-1 text-2xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                (hoverScore || score) >= value ? 'text-amber-400' : 'text-slate-300'
              }`}
              aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment..."
        maxLength={500}
        rows={2}
        className="mb-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
      <button
        type="submit"
        disabled={submitting || score === 0}
        className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed btn-active"
      >
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  );
}
