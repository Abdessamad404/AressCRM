import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { quizApi } from '../../api/client';
import {
  ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock,
  ChevronDown, ChevronUp, Users, TrendingUp, Award, Pencil, Save
} from 'lucide-react';
import type { QuizSubmissionResult, QuestionResult } from '../../types/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number | null | undefined): string {
  return n == null ? '—' : `${n}%`;
}

function ScoreBadge({ percentage, passed }: { percentage: number | null; passed: boolean | null }) {
  if (percentage === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
        <AlertCircle size={11} /> Pending
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
      passed
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
    }`}>
      {passed ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {percentage}%
    </span>
  );
}

// ─── Per-question result card ─────────────────────────────────────────────────

function QuestionResultCard({ qr, index }: { qr: QuestionResult; index: number }) {
  const isPending = qr.is_correct === null;
  const isCorrect = qr.is_correct === true;

  const borderColor = isPending
    ? 'border-l-amber-400 dark:border-l-amber-600'
    : isCorrect
    ? 'border-l-green-500 dark:border-l-green-600'
    : 'border-l-red-500 dark:border-l-red-600';

  return (
    <div className={`bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 ${borderColor} p-4 space-y-3`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-gray-400 shrink-0">Q{index + 1}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 capitalize shrink-0">
            {qr.type.replace('_', ' ')}
          </span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
          isPending
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
            : isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {isPending ? `? / ${qr.points} pts` : `${qr.points_earned} / ${qr.points} pts`}
        </span>
      </div>

      {/* Question text */}
      <p className="text-sm font-medium text-gray-900 dark:text-white">{qr.question}</p>

      {/* Multiple Choice options */}
      {qr.type === 'multiple_choice' && qr.options && (
        <div className="space-y-1.5">
          {qr.options.map((opt, oi) => {
            if (!opt) return null;
            const isSelected  = qr.user_answer === String(oi);
            const isCorrectOpt = qr.correct_answer === String(oi);
            return (
              <div key={oi} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border ${
                isCorrectOpt
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : isSelected && !isCorrectOpt
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  : 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {isCorrectOpt
                  ? <CheckCircle size={13} className="text-green-600 dark:text-green-400 shrink-0" />
                  : isSelected
                  ? <XCircle size={13} className="text-red-500 shrink-0" />
                  : <span className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0 inline-block" />
                }
                <span>{opt}</span>
                {isSelected && !isCorrectOpt && (
                  <span className="ml-auto text-xs text-red-500 font-medium shrink-0">candidate's answer</span>
                )}
                {isCorrectOpt && isSelected && (
                  <span className="ml-auto text-xs text-green-600 font-medium shrink-0">correct ✓</span>
                )}
                {isCorrectOpt && !isSelected && (
                  <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium shrink-0">correct answer</span>
                )}
              </div>
            );
          })}
          {qr.user_answer === null && (
            <p className="text-xs text-gray-400 italic px-1">No answer given</p>
          )}
        </div>
      )}

      {/* True / False */}
      {qr.type === 'true_false' && (
        <div className="flex gap-2">
          {['True', 'False'].map((opt) => {
            const isSelected   = qr.user_answer === opt;
            const isCorrectOpt = qr.correct_answer === opt;
            return (
              <div key={opt} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm border font-medium ${
                isCorrectOpt && isSelected
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : isCorrectOpt && !isSelected
                  ? 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10 text-green-600 dark:text-green-500'
                  : isSelected && !isCorrectOpt
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  : 'border-gray-100 dark:border-gray-800 text-gray-400'
              }`}>
                {isCorrectOpt ? <CheckCircle size={13} /> : isSelected ? <XCircle size={13} /> : null}
                {opt}
              </div>
            );
          })}
        </div>
      )}

      {/* Short Answer */}
      {qr.type === 'short_answer' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Candidate's answer:</p>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 min-h-[40px]">
            {qr.user_answer || <span className="text-gray-400 italic">No answer provided</span>}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle size={11} /> Requires manual scoring
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Submission detail panel (expanded) ───────────────────────────────────────

function SubmissionDetail({
  sub,
  quizId,
  onReviewed,
}: {
  sub: QuizSubmissionResult;
  quizId: string;
  onReviewed: () => void;
}) {
  const queryClient = useQueryClient();
  const [manualScore, setManualScore] = useState<string>(String(sub.score ?? ''));
  const [notes, setNotes] = useState(sub.reviewer_notes ?? '');

  const reviewMutation = useMutation({
    mutationFn: () =>
      quizApi.reviewSubmission(quizId, sub.id, {
        score:          manualScore !== '' ? Number(manualScore) : undefined,
        reviewer_notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-submissions', quizId] });
      onReviewed();
    },
  });

  const hasShortAnswer = sub.question_results?.some((q) => q.type === 'short_answer');
  const hasEssay = Boolean(sub.essay_result);

  return (
    <div className="mt-4 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
      {/* Question breakdown */}
      {(sub.question_results?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Question Breakdown</p>
          {sub.question_results.map((qr, i) => (
            <QuestionResultCard key={qr.id} qr={qr} index={i} />
          ))}
        </div>
      )}

      {/* Essay */}
      {sub.essay_result && (
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-900/40 p-4 space-y-2">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Essay</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{sub.essay_result.prompt}</p>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-amber-100 dark:border-amber-900/30 p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[60px]">
            {sub.essay_result.user_answer || <span className="text-gray-400 italic">No essay provided</span>}
          </div>
        </div>
      )}

      {/* Review panel */}
      {(hasShortAnswer || hasEssay || sub.status !== 'reviewed') && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Pencil size={12} /> Review
          </p>

          {(hasShortAnswer || hasEssay) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Final Score (override auto-graded score)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={sub.max_score ?? undefined}
                  value={manualScore}
                  onChange={(e) => setManualScore(e.target.value)}
                  placeholder={`Auto: ${sub.score ?? 0}`}
                  className="w-28 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">/ {sub.max_score} pts</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Reviewer Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add feedback or notes for your records..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 resize-none"
            />
          </div>

          <button
            onClick={() => reviewMutation.mutate()}
            disabled={reviewMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {reviewMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Clock size={14} className="animate-spin" /> Saving...
              </span>
            ) : (
              <><Save size={14} /> Save Review</>
            )}
          </button>
          {reviewMutation.isSuccess && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle size={12} /> Saved
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuizSubmissions() {
  const { id: quizId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: quiz } = useQuery({
    queryKey: ['client-quiz', quizId],
    queryFn: () => quizApi.get(quizId!),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['quiz-submissions', quizId, page],
    queryFn: () => quizApi.getSubmissions(quizId!, page),
    placeholderData: (prev) => prev,
  });

  const submissions = data?.data ?? [];

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalCount  = data?.total ?? 0;
  const passedCount = submissions.filter((s) => s.passed === true).length;
  const avgPct = submissions.length > 0
    ? Math.round(submissions.filter((s) => s.percentage != null).reduce((sum, s) => sum + (s.percentage ?? 0), 0) /
      Math.max(1, submissions.filter((s) => s.percentage != null).length))
    : null;

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {quiz?.title ?? 'Quiz'} — Submissions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review and score candidate submissions</p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users size={16} className="text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Submissions</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgPct != null ? `${avgPct}%` : '—'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Avg. Score</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Award size={16} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{passedCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Passed</p>
        </div>
      </div>

      {/* Submissions list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No submissions yet</p>
          <p className="text-sm mt-1">Submissions will appear here once commercials take this quiz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const isExpanded = expandedId === sub.id;
            return (
              <div key={sub.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold shrink-0">
                      {sub.user?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>

                    {/* Candidate info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {sub.user?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sub.user?.email}</p>
                    </div>

                    {/* Score + percentage */}
                    <div className="text-right shrink-0 space-y-1">
                      <ScoreBadge percentage={sub.percentage ?? null} passed={sub.passed ?? null} />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {sub.score ?? '?'} / {sub.max_score ?? '?'} pts
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                      sub.status === 'reviewed'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {sub.status}
                    </span>

                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpand(sub.id)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* Submitted date + quick stats */}
                  <div className="flex items-center gap-4 mt-2 ml-14 text-xs text-gray-400">
                    {sub.submitted_at && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(sub.submitted_at).toLocaleString()}
                      </span>
                    )}
                    {(sub.question_results?.length ?? 0) > 0 && (
                      <>
                        <span className="text-green-600 dark:text-green-400">
                          {sub.question_results.filter((q) => q.is_correct === true).length} correct
                        </span>
                        {sub.question_results.filter((q) => q.is_correct === false).length > 0 && (
                          <span className="text-red-500">
                            {sub.question_results.filter((q) => q.is_correct === false).length} wrong
                          </span>
                        )}
                        {sub.question_results.filter((q) => q.is_correct === null).length > 0 && (
                          <span className="text-amber-500">
                            {sub.question_results.filter((q) => q.is_correct === null).length} pending
                          </span>
                        )}
                      </>
                    )}
                    {sub.reviewer_notes && (
                      <span className="text-blue-500">Note added</span>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5">
                    <SubmissionDetail
                      sub={sub}
                      quizId={quizId!}
                      onReviewed={() => setExpandedId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {(data?.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {data?.last_page}</span>
          <button onClick={() => setPage((p) => Math.min(data?.last_page ?? 1, p + 1))} disabled={page === data?.last_page}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
