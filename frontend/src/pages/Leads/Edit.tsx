import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { leadsApi } from '../../api/leads';
import api from '../../api/axios';
import type { LeadFormData } from '../../types/lead';
import { ArrowLeft, Loader2 } from 'lucide-react';

const SOURCES = ['LinkedIn', 'Referral', 'Cold call', 'Website', 'Other'] as const;
const STATUSES = ['New', 'Contacted', 'Interested', 'Negotiation', 'Won', 'Lost'] as const;

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(SOURCES).optional(),
  status: z.enum(STATUSES).optional(),
  notes: z.string().optional(),
  assigned_to_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LeadEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.getOne(id!),
  });

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => { const r = await api.get('/api/users'); return r.data.data; },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: lead ? {
      name: lead.name, email: lead.email, phone: lead.phone ?? '', company: lead.company ?? '',
      source: lead.source ?? undefined, status: lead.status, notes: lead.notes ?? '',
      assigned_to_id: lead.assigned_to?.id ?? '',
    } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<LeadFormData>) => leadsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      navigate(`/leads/${id}`);
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data as Partial<LeadFormData>);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Lead</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{lead?.name}</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name')} className="input" placeholder="John Doe" />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email *</label>
              <input {...register('email')} type="email" className="input" placeholder="john@example.com" />
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+1 555 0000" />
            </div>
            <div>
              <label className="label">Company</label>
              <input {...register('company')} className="input" placeholder="Acme Inc." />
            </div>
            <div>
              <label className="label">Source</label>
              <select {...register('source')} className="input">
                <option value="">Select source</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Assign To</label>
              <select {...register('assigned_to_id')} className="input">
                <option value="">Unassigned</option>
                {(users ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea {...register('notes')} rows={3} className="input resize-none" placeholder="Any additional notes..." />
            </div>
          </div>

          {mutation.isError && <p className="text-sm text-rose-500">Failed to update lead. Please try again.</p>}

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
