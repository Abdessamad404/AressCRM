import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { quizApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  Clock, ArrowLeft, ArrowRight, Send, Briefcase,
  CheckCircle, XCircle, AlertCircle, Award, BookOpen,
} from 'lucide-react';
import type { QuizSubmissionResult, QuestionResult } from '../../types/client';

// ── LocalStorage helpers ──────────────────────────────────────────────────────
const storageKey = (id: string) => `quiz_progress_${id}`;

function loadProgress(id: string): { answers: Record<string, string>; essay: string; step: number } | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveProgress(id: string, answers: Record<string, string>, essay: string, step: number) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify({ answers, essay, step }));
  } catch { /* ignore */ }
}

function clearProgress(id: string) {
  try { localStorage.removeItem(storageKey(id)); } catch { /* ignore */ }
}

// ── Rich Results sub-components ───────────────────────────────────────────────

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
      {/* Header */}
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

      {/* Multiple choice */}
      {qr.type === 'multiple_choice' && qr.options && (
        <div className="space-y-1.5">
          {qr.options.map((opt, oi) => {
            if (!opt) return null;
            const isSelected   = qr.user_answer === String(oi);
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
                  <span className="ml-auto text-xs text-red-500 font-medium shrink-0">your answer</span>
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
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Your answer:</p>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 min-h-[40px]">
            {qr.user_answer || <span className="text-gray-400 italic">No answer provided</span>}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle size={11} /> Will be reviewed manually
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function QuizTake() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCommercial = user?.client_type === 'commercial';

  // Optional "came from offer" context passed via Link state
  const fromOfferId: string | undefined    = (location.state as any)?.fromOfferId;
  const fromOfferTitle: string | undefined = (location.state as any)?.fromOfferTitle;

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz-take', id],
    queryFn: () => quizApi.get(id!),
  });

  // Restore from localStorage on first load
  const savedProgress = id ? loadProgress(id) : null;
  const [answers, setAnswers]         = useState<Record<string, string>>(savedProgress?.answers ?? {});
  const [essayAnswer, setEssay]       = useState(savedProgress?.essay ?? '');
  const [currentStep, setStep]        = useState(savedProgress?.step ?? 0);
  const [result, setResult]           = useState<QuizSubmissionResult | null>(null);
  const [timeLeft, setTimeLeft]       = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist to localStorage on every change
  useEffect(() => {
    if (id && !result) saveProgress(id, answers, essayAnswer, currentStep);
  }, [answers, essayAnswer, currentStep, id, result]);

  useEffect(() => {
    if (quiz?.time_limit_minutes && timeLeft === null) {
      setTimeLeft(quiz.time_limit_minutes * 60);
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t === null || t <= 1) {
            clearInterval(intervalRef.current!);
            submitMutation.mutate();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

  const submitMutation = useMutation({
    mutationFn: () => quizApi.submit(id!, { answers, essay_answer: essayAnswer || undefined }),
    onSuccess: (data) => {
      if (id) clearProgress(id);
      setResult(data);
    },
  });

  const handleSubmit = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    submitMutation.mutate();
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!quiz) return <div className="p-8 text-gray-500">Quiz not found.</div>;

  const isPreview  = !isCommercial;
  const questions  = quiz.questions ?? [];
  const totalSteps = questions.length + (quiz.essay_prompt ? 1 : 0);
  const isEssayStep     = currentStep >= questions.length;
  const currentQuestion = !isEssayStep ? questions[currentStep] : null;

  // ── Rich Results Screen ────────────────────────────────────────────────────
  if (result) {
    const { percentage, passed, question_results, essay_result } = result;
    const correctCount = question_results.filter((q) => q.is_correct === true).length;
    const pendingCount = question_results.filter((q) => q.is_correct === null).length;
    const totalQs      = question_results.length;

    // Hero badge appearance
    const heroBg    = percentage === null ? 'bg-amber-100 dark:bg-amber-900/30'
                    : passed             ? 'bg-green-100 dark:bg-green-900/30'
                    :                      'bg-red-100 dark:bg-red-900/30';
    const heroColor = percentage === null ? 'text-amber-600 dark:text-amber-400'
                    : passed             ? 'text-green-600 dark:text-green-400'
                    :                      'text-red-600 dark:text-red-400';
    const heroTitle = percentage === null ? 'Submitted for Review'
                    : passed             ? 'Passed!'
                    :                      'Not Passed';

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* ── Score Hero ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center space-y-4">
          <div className={`w-20 h-20 rounded-full ${heroBg} flex items-center justify-center mx-auto`}>
            {percentage === null
              ? <AlertCircle size={36} className={heroColor} />
              : passed
              ? <Award size={36} className={heroColor} />
              : <XCircle size={36} className={heroColor} />
            }
          </div>

          <div>
            <h2 className={`text-2xl font-bold ${heroColor}`}>{heroTitle}</h2>
            {percentage !== null && (
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">{percentage}%</p>
            )}
          </div>

          {/* Stat row */}
          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{totalQs}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
            </div>
            {correctCount > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{correctCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Correct</p>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending review</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {result.score ?? 0} / {result.max_score ?? 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
            </div>
          </div>

          {quiz.essay_prompt && (
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
              <AlertCircle size={13} /> Your essay will be reviewed manually.
            </p>
          )}
        </div>

        {/* ── Per-question breakdown ── */}
        {question_results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Question Breakdown</h3>
            </div>
            {question_results.map((qr, i) => (
              <QuestionResultCard key={qr.id} qr={qr} index={i} />
            ))}
          </div>
        )}

        {/* ── Essay block ── */}
        {essay_result && (
          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-5 space-y-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Open-ended Essay
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{essay_result.prompt}</p>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-amber-100 dark:border-amber-900/30 p-3.5 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[60px]">
              {essay_result.user_answer || <span className="text-gray-400 italic">No essay provided</span>}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle size={11} /> This will be reviewed by the employer.
            </p>
          </div>
        )}

        {/* ── Footer actions ── */}
        <div className="flex flex-col gap-2 pb-4">
          {fromOfferId && (
            <Link
              to={`/client/job-offers/${fromOfferId}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Briefcase size={15} /> Back to {fromOfferTitle ?? 'Offer'}
            </Link>
          )}
          <button
            onClick={() => navigate('/client/quizzes')}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            All Quizzes
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz taking screen ────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {timeLeft !== null && (
          <div className={`flex items-center gap-2 text-sm font-mono font-semibold px-3 py-1.5 rounded-xl ${
            timeLeft < 60
              ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            <Clock size={14} />
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Quiz meta */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
            {quiz.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{quiz.description}</p>}
          </div>
          {isPreview && (
            <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium">
              Preview
            </span>
          )}
        </div>
        {savedProgress && !result && (
          <p className="text-xs text-primary-600 dark:text-primary-400 mt-2">Progress restored — you can pick up where you left off.</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>Question {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Question / Essay card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-5 min-h-[220px]">
        {isEssayStep ? (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Open-ended Essay</span>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-2">{quiz.essay_prompt}</p>
            </div>
            <textarea
              value={essayAnswer}
              onChange={(e) => setEssay(e.target.value)}
              rows={6}
              disabled={isPreview}
              placeholder="Write your answer here..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 resize-none disabled:opacity-60"
            />
          </div>
        ) : currentQuestion ? (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' :
                 currentQuestion.type === 'true_false' ? 'True / False' : 'Short Answer'}
                {' · '}{currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}
              </span>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-2">{currentQuestion.question}</p>
            </div>

            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((opt, oi) => opt && (
                  <label key={oi} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    answers[currentQuestion.id] === String(oi)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${isPreview ? 'cursor-default' : ''}`}>
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={String(oi)}
                      checked={answers[currentQuestion.id] === String(oi)}
                      onChange={() => !isPreview && setAnswers((a) => ({ ...a, [currentQuestion.id]: String(oi) }))}
                      className="text-primary-600 focus:ring-primary-400"
                      disabled={isPreview}
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'true_false' && (
              <div className="flex gap-3">
                {['True', 'False'].map((opt) => (
                  <label key={opt} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    answers[currentQuestion.id] === opt
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${isPreview ? 'cursor-default' : ''}`}>
                    <input
                      type="radio"
                      value={opt}
                      checked={answers[currentQuestion.id] === opt}
                      onChange={() => !isPreview && setAnswers((a) => ({ ...a, [currentQuestion.id]: opt }))}
                      className="text-primary-600"
                      disabled={isPreview}
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'short_answer' && (
              <textarea
                value={answers[currentQuestion.id] ?? ''}
                onChange={(e) => !isPreview && setAnswers((a) => ({ ...a, [currentQuestion.id]: e.target.value }))}
                rows={3}
                disabled={isPreview}
                placeholder="Type your answer..."
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 resize-none disabled:opacity-60"
              />
            )}
          </div>
        ) : null}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          <ArrowLeft size={15} /> Previous
        </button>

        {currentStep < totalSteps - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Next <ArrowRight size={15} />
          </button>
        ) : !isPreview ? (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {submitMutation.isPending ? 'Submitting...' : <><Send size={15} /> Submit Quiz</>}
          </button>
        ) : (
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Done (Preview)
          </button>
        )}
      </div>
    </div>
  );
}
