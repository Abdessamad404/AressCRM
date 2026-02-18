import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { quizApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, ArrowLeft, ArrowRight, Send } from 'lucide-react';

export default function QuizTake() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCommercial = user?.client_type === 'commercial';

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz-take', id],
    queryFn: () => quizApi.get(id!),
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [essayAnswer, setEssayAnswer] = useState('');
  const [currentStep, setCurrentStep] = useState(0); // 0..n-1 = questions, n = essay
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (quiz?.time_limit_minutes) {
      setTimeLeft(quiz.time_limit_minutes * 60);
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t === null || t <= 1) {
            clearInterval(intervalRef.current!);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [quiz]);

  const submitMutation = useMutation({
    mutationFn: () => quizApi.submit(id!, { answers, essay_answer: essayAnswer || undefined }),
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz) return <div className="p-8 text-gray-500">Quiz not found.</div>;

  // Entreprise preview mode (no submit)
  const isPreview = !isCommercial;

  const questions = quiz.questions ?? [];
  const totalSteps = questions.length + (quiz.essay_prompt ? 1 : 0);
  const isEssayStep = currentStep >= questions.length;
  const currentQuestion = !isEssayStep ? questions[currentStep] : null;

  if (submitted) {
    const result = submitMutation.data;
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quiz Submitted!</h2>
          {result && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-3xl font-black text-primary-600 dark:text-primary-400">
                {result.score} / {result.max_score}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">points scored</p>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {quiz.essay_prompt
              ? 'Your essay will be reviewed by the entreprise.'
              : 'Your results have been submitted.'}
          </p>
          <button onClick={() => navigate('/client/quizzes')}
            className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        {timeLeft !== null && (
          <div className={`flex items-center gap-2 text-sm font-mono font-semibold ${timeLeft < 60 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
            <Clock size={16} />
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{quiz.title}</h1>
        {quiz.description && <p className="text-sm text-gray-500 dark:text-gray-400">{quiz.description}</p>}
        {isPreview && (
          <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium">
            Preview mode
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Question or Essay */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-5 min-h-[220px]">
        {isEssayStep ? (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Open-ended Essay</span>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-2">{quiz.essay_prompt}</p>
            </div>
            <textarea
              value={essayAnswer}
              onChange={(e) => setEssayAnswer(e.target.value)}
              rows={6}
              disabled={isPreview}
              placeholder="Write your answer here..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 resize-none disabled:opacity-60"
            />
          </div>
        ) : currentQuestion ? (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' :
                 currentQuestion.type === 'true_false' ? 'True / False' : 'Short Answer'} • {currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}
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
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          <ArrowLeft size={15} /> Previous
        </button>

        {currentStep < totalSteps - 1 ? (
          <button
            onClick={() => setCurrentStep((s) => s + 1)}
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
            onClick={() => navigate('/client/quizzes')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Done (Preview)
          </button>
        )}
      </div>
    </div>
  );
}
