import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { quizApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen, Plus, Clock, CheckCircle, AlertCircle,
  Pencil, Trash2, ChevronRight, Users
} from 'lucide-react';
import type { Quiz } from '../../types/client';

export default function QuizzesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEntreprise = user?.client_type === 'entreprise';
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['client-quizzes', page],
    queryFn: () => quizApi.list({ page }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: quizApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-quizzes'] }),
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete quiz "${title}"?`)) deleteMutation.mutate(id);
  };

  // Commercial: show my submissions
  const { data: submissionsData } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: quizApi.mySubmissions,
    enabled: !isEntreprise,
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEntreprise ? 'My Quizzes' : 'Quizzes'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isEntreprise
              ? 'Create quizzes to assess commercial candidates'
              : 'Take quizzes to showcase your skills to entreprises'}
          </p>
        </div>
        {isEntreprise && (
          <Link
            to="/client/quizzes/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus size={16} /> Create Quiz
          </Link>
        )}
      </div>

      {/* Commercial: my submissions summary */}
      {!isEntreprise && (submissionsData?.total ?? 0) > 0 && (
        <div className="mb-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-900/40 p-4">
          <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
            You have completed {submissionsData?.total} quiz{(submissionsData?.total ?? 0) > 1 ? 'zes' : ''}.
          </p>
          <div className="flex gap-3 mt-2">
            {submissionsData?.data.slice(0, 3).map((sub) => (
              <Link
                key={sub.id}
                to={`/client/quizzes/${sub.quiz_id}`}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                {sub.quiz?.title ?? 'Quiz'} — {sub.score ?? 0}/{sub.max_score ?? '?'} pts
              </Link>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (data?.data?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No quizzes yet</p>
          {isEntreprise && (
            <Link to="/client/quizzes/create" className="text-primary-600 dark:text-primary-400 hover:underline text-sm mt-1 inline-block">
              Create your first quiz
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data?.data.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              isOwner={isEntreprise}
              onDelete={() => handleDelete(quiz.id, quiz.title)}
            />
          ))}
        </div>
      )}

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

function QuizCard({ quiz, isOwner, onDelete }: { quiz: Quiz; isOwner: boolean; onDelete: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <Link to={`/client/quizzes/${quiz.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {quiz.title}
          </Link>
          {quiz.job_offer && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              for {quiz.job_offer.title}
            </p>
          )}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
          quiz.is_published
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {quiz.is_published ? 'Published' : 'Draft'}
        </span>
      </div>

      {quiz.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{quiz.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
        {quiz.time_limit_minutes && (
          <span className="flex items-center gap-1"><Clock size={12} /> {quiz.time_limit_minutes}min</span>
        )}
        {quiz.questions && (
          <span className="flex items-center gap-1"><BookOpen size={12} /> {quiz.questions.length} questions</span>
        )}
        {isOwner && quiz.submissions_count !== undefined && (
          <span className="flex items-center gap-1"><Users size={12} /> {quiz.submissions_count} submissions</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <Link to={`/client/quizzes/${quiz.id}/edit`}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                <Pencil size={14} />
              </Link>
              <button onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                <Trash2 size={14} />
              </button>
              <Link to={`/client/quizzes/${quiz.id}/submissions`}
                className="text-xs text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Submissions
              </Link>
            </>
          )}
        </div>
        <Link to={`/client/quizzes/${quiz.id}`}
          className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
          {isOwner ? 'Edit / Preview' : 'Take Quiz'} <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
