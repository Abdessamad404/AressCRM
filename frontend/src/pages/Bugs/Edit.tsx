import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { bugsApi } from '../../api/bugs';
import { leadsApi } from '../../api/leads';
import api from '../../api/axios';
import type { BugFormData } from '../../types/bug';
import { ArrowLeft, Loader2 } from 'lucide-react';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigned_to_id: z.string().optional(),
  related_lead_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function BugEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: bug, isLoading } = useQuery({
    queryKey: ['bug', id],
    queryFn: () => bugsApi.getOne(id!),
  });

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => { const r = await api.get('/api/users'); return r.data.data; },
  });

  const { data: leads } = useQuery({
    queryKey: ['leads-all'],
    queryFn: () => leadsApi.getAll({ per_page: 200 }),
    select: (data) => data.data,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: bug ? {
      title: bug.title,
      description: bug.description,
      status: bug.status,
      priority: bug.priority,
      assigned_to_id: bug.assigned_to?.id ?? '',
      related_lead_id: bug.related_lead?.id ?? '',
    } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<BugFormData>) => bugsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      queryClient.invalidateQueries({ queryKey: ['bug', id] });
      navigate(`/bugs/${id}`);
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data as Partial<BugFormData>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Bug</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{bug?.title}</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input {...register('title')} className="input" placeholder="Brief description of the bug" />
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea {...register('description')} rows={4} className="input resize-none" placeholder="Steps to reproduce, expected vs actual behavior..." />
            {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="input">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assign To</label>
              <select {...register('assigned_to_id')} className="input">
                <option value="">Unassigned</option>
                {(users ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Related Lead</label>
              <select {...register('related_lead_id')} className="input">
                <option value="">None</option>
                {(leads ?? []).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          {mutation.isError && <p className="text-sm text-rose-500">Failed to update bug. Please try again.</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary">
              {(isSubmitting || mutation.isPending) ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
