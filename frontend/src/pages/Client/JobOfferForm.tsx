import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { jobOfferApi } from '../../api/client';
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react';

const schema = z.object({
  title:             z.string().min(1, 'Title is required'),
  description:       z.string().min(1, 'Description is required'),
  company_name:      z.string().min(1, 'Company name is required'),
  location:          z.string().optional(),
  sector:            z.string().optional(),
  mission_type:      z.enum(['direct_sales', 'lead_gen', 'demo', 'other']).optional(),
  commission_rate:   z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  contract_duration: z.string().optional(),
  status:            z.enum(['draft', 'published', 'closed']).default('draft'),
  requirements:      z.array(z.object({ value: z.string() })).optional(),
  benefits:          z.array(z.object({ value: z.string() })).optional(),
});

type FormData = z.infer<typeof schema>;

export default function JobOfferForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['client-job-offer', id],
    queryFn: () => jobOfferApi.get(id!),
    enabled: isEdit,
  });

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft', requirements: [], benefits: [] },
  });

  const { fields: reqFields, append: appendReq, remove: removeReq } = useFieldArray({ control, name: 'requirements' });
  const { fields: benFields, append: appendBen, remove: removeBen } = useFieldArray({ control, name: 'benefits' });

  useEffect(() => {
    if (existing) {
      reset({
        title:             existing.title,
        description:       existing.description,
        company_name:      existing.company_name,
        location:          existing.location ?? '',
        sector:            existing.sector ?? '',
        mission_type:      existing.mission_type ?? undefined,
        commission_rate:   existing.commission_rate ?? '',
        contract_duration: existing.contract_duration ?? '',
        status:            existing.status,
        requirements:      (existing.requirements ?? []).map((v) => ({ value: v })),
        benefits:          (existing.benefits ?? []).map((v) => ({ value: v })),
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        requirements: (data.requirements ?? []).map((r) => r.value).filter(Boolean),
        benefits:     (data.benefits ?? []).map((b) => b.value).filter(Boolean),
        commission_rate: data.commission_rate === '' ? undefined : data.commission_rate,
      };
      return isEdit ? jobOfferApi.update(id!, payload) : jobOfferApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-job-offers'] });
      navigate('/client/job-offers');
    },
  });

  const onSubmit = (data: FormData) => mutation.mutateAsync(data).catch(() => {});

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isEdit ? 'Edit Job Offer' : 'Post a Job Offer'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Basic Information</h2>

          <FormField label="Job Title *" error={errors.title?.message}>
            <input {...register('title')} placeholder="e.g. Sales Representative B2B" className={inputClass} />
          </FormField>

          <FormField label="Company Name *" error={errors.company_name?.message}>
            <input {...register('company_name')} placeholder="Your company name" className={inputClass} />
          </FormField>

          <FormField label="Description *" error={errors.description?.message}>
            <textarea {...register('description')} rows={4} placeholder="Describe the role, responsibilities..." className={`${inputClass} resize-none`} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Location" error={errors.location?.message}>
              <input {...register('location')} placeholder="Paris, France" className={inputClass} />
            </FormField>
            <FormField label="Sector" error={errors.sector?.message}>
              <input {...register('sector')} placeholder="SaaS, Finance..." className={inputClass} />
            </FormField>
          </div>
        </div>

        {/* Commercial terms */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Commercial Terms</h2>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mission Type">
              <select {...register('mission_type')} className={`${inputClass} appearance-none`}>
                <option value="">Select type</option>
                <option value="direct_sales">Direct Sales</option>
                <option value="lead_gen">Lead Generation</option>
                <option value="demo">Demo / Presentation</option>
                <option value="other">Other</option>
              </select>
            </FormField>

            <FormField label="Commission Rate (%)">
              <input {...register('commission_rate')} type="number" min="0" max="100" step="0.5" placeholder="e.g. 10" className={inputClass} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Contract Duration">
              <select {...register('contract_duration')} className={`${inputClass} appearance-none`}>
                <option value="">Select duration</option>
                <option value="1month">1 Month</option>
                <option value="3months">3 Months</option>
                <option value="6months">6 Months</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </FormField>

            <FormField label="Status">
              <select {...register('status')} className={`${inputClass} appearance-none`}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </FormField>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Requirements</h2>
            <button type="button" onClick={() => appendReq({ value: '' })} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
              <Plus size={13} /> Add
            </button>
          </div>
          {reqFields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <input {...register(`requirements.${i}.value`)} placeholder="e.g. 2+ years B2B experience" className={`${inputClass} flex-1`} />
              <button type="button" onClick={() => removeReq(i)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {reqFields.length === 0 && (
            <p className="text-xs text-gray-400">No requirements added yet.</p>
          )}
        </div>

        {/* Benefits */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Benefits</h2>
            <button type="button" onClick={() => appendBen({ value: '' })} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
              <Plus size={13} /> Add
            </button>
          </div>
          {benFields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <input {...register(`benefits.${i}.value`)} placeholder="e.g. Uncapped commission" className={`${inputClass} flex-1`} />
              <button type="button" onClick={() => removeBen(i)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {benFields.length === 0 && (
            <p className="text-xs text-gray-400">No benefits added yet.</p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">Failed to save. Please try again.</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (isEdit ? 'Update Offer' : 'Post Offer')}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

const inputClass = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 focus:border-primary-400 transition-all';
