import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { leadsApi } from '../../api/leads';
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
});

type FormData = z.infer<typeof schema>;

export default function LeadCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'New' },
  });

  const mutation = useMutation({
    mutationFn: (data: LeadFormData) => leadsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      navigate('/leads');
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data as LeadFormData);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Lead</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add a new lead to your pipeline</p>
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
              <label className="label">Notes</label>
              <textarea {...register('notes')} rows={3} className="input resize-none" placeholder="Any additional notes..." />
            </div>
          </div>

          {mutation.isError && <p className="text-sm text-rose-500">Failed to create lead. Please try again.</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary">
              {(isSubmitting || mutation.isPending) ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
