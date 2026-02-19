import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { quizApi } from '../../api/client';
import { Plus, Trash2, Loader2, ArrowLeft, GripVertical, CheckCircle } from 'lucide-react';

const questionSchema = z.object({
  question:       z.string().min(1, 'Question text required'),
  type:           z.enum(['multiple_choice', 'true_false', 'short_answer']),
  options:        z.array(z.string()).optional(),
  correct_answer: z.string().optional(),
  points:         z.coerce.number().min(1).default(1),
  order:          z.number().optional(),
});

const schema = z.object({
  title:              z.string().min(1, 'Title is required'),
  description:        z.string().optional(),
  essay_prompt:       z.string().optional(),
  time_limit_minutes: z.coerce.number().min(1).max(360).optional().or(z.literal('')),
  is_published:       z.boolean().default(false),
  questions:          z.array(questionSchema).optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 focus:border-primary-400 transition-all';

export default function QuizForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['client-quiz', id],
    queryFn: () => quizApi.get(id!),
    enabled: isEdit,
  });

  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_published: false,
      questions: [],
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
  });

  useEffect(() => {
    if (existing) {
      reset({
        title:              existing.title,
        description:        existing.description ?? '',
        essay_prompt:       existing.essay_prompt ?? '',
        time_limit_minutes: existing.time_limit_minutes ?? '',
        is_published:       existing.is_published,
        questions:          (existing.questions ?? []).map((q) => ({
          question:       q.question,
          type:           q.type,
          options:        q.options ?? [],
          correct_answer: q.correct_answer ?? '',
          points:         q.points,
          order:          q.order,
        })) as FormData['questions'],
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        time_limit_minutes: data.time_limit_minutes === '' ? undefined : data.time_limit_minutes,
        questions: (data.questions ?? []).map((q, i) => ({
          ...q,
          order: i,
          options: q.options?.filter(Boolean),
        })),
      };
      return isEdit ? quizApi.update(id!, payload) : quizApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-quizzes'] });
      navigate('/client/quizzes');
    },
  });

  const addQuestion = (type: 'multiple_choice' | 'true_false' | 'short_answer') => {
    appendQuestion({
      question:       '',
      type,
      options:        type === 'multiple_choice' ? ['', '', '', ''] : type === 'true_false' ? ['True', 'False'] : [],
      correct_answer: '',
      points:         1,
    });
  };

  const onSubmit = handleSubmit((d) => mutation.mutateAsync(d as FormData).catch(() => {}));

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isEdit ? 'Edit Quiz' : 'Create Quiz'}
      </h1>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Meta */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Quiz Details</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title *</label>
            <input {...register('title')} placeholder="e.g. Sales Assessment Q1" className={inputClass} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
            <textarea {...register('description')} rows={2} placeholder="Brief description of what this quiz evaluates..." className={`${inputClass} resize-none`} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Time Limit (minutes)</label>
            <input {...register('time_limit_minutes')} type="number" min="1" placeholder="e.g. 30 (leave blank for no limit)" className={inputClass} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Publish Quiz</p>
              <p className="text-xs text-gray-400 mt-0.5">Make available to commercials</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register('is_published')} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-primary-600 after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Questions ({questionFields.length})</h2>
          </div>

          {questionFields.map((field, i) => {
            const qType = watch(`questions.${i}.type`);
            return (
              <div key={field.id} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-300 shrink-0" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Q{i + 1}</span>
                  <select {...register(`questions.${i}.type`)} className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 ml-auto">
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                  <button type="button" onClick={() => removeQuestion(i)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                <input {...register(`questions.${i}.question`)} placeholder="Enter your question..." className={inputClass} />

                {qType === 'multiple_choice' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Options (enter the index of correct answer: 0, 1, 2...)</p>
                    {[0, 1, 2, 3].map((oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-4">{oi}.</span>
                        <input {...register(`questions.${i}.options.${oi}`)} placeholder={`Option ${oi + 1}`} className={`${inputClass} flex-1`} />
                      </div>
                    ))}
                    <input {...register(`questions.${i}.correct_answer`)} placeholder="Correct answer index (e.g. 0)" className={inputClass} />
                  </div>
                )}

                {qType === 'true_false' && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Correct answer</p>
                    <select {...register(`questions.${i}.correct_answer`)} className={`${inputClass} w-40`}>
                      <option value="">Select...</option>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  </div>
                )}

                {qType === 'short_answer' && (
                  <p className="text-xs text-gray-400 italic">Short answer questions will be manually reviewed.</p>
                )}

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Points:</label>
                  <input {...register(`questions.${i}.points`)} type="number" min="1" className="w-16 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-300" />
                </div>
              </div>
            );
          })}

          {/* Add question buttons */}
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => addQuestion('multiple_choice')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <Plus size={13} /> Multiple Choice
            </button>
            <button type="button" onClick={() => addQuestion('true_false')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <Plus size={13} /> True / False
            </button>
            <button type="button" onClick={() => addQuestion('short_answer')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <Plus size={13} /> Short Answer
            </button>
          </div>
        </div>

        {/* Essay prompt */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Essay Section</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Optional open-ended question at the end of the quiz</p>
          </div>
          <textarea {...register('essay_prompt')} rows={3} placeholder="e.g. Describe a time when you exceeded your sales quota and what strategies contributed to your success..." className={`${inputClass} resize-none`} />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">Failed to save quiz. Please try again.</p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (isEdit ? 'Update Quiz' : 'Create Quiz')}
          </button>
        </div>
      </form>
    </div>
  );
}
