import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { jobOfferApi } from '../../api/client';
import { Plus, Trash2, Loader2, ArrowLeft, Upload, X, FileText } from 'lucide-react';

const schema = z.object({
  title:             z.string().min(1, 'Title is required'),
  description:       z.string().min(1, 'Description is required'),
  company_name:      z.string().min(1, 'Company name is required'),
  location:          z.string().optional(),
  sector:            z.string().optional(),
  mission_type:      z.enum(['direct_sales', 'lead_gen', 'demo', 'other']).optional(),
  compensation_type: z.enum(['commission', 'fixed_budget']).default('commission'),
  commission_rate:   z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  budget_amount:     z.coerce.number().min(0).optional().or(z.literal('')),
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [productSheetFile, setProductSheetFile] = useState<File | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['client-job-offer', id],
    queryFn: () => jobOfferApi.get(id!),
    enabled: isEdit,
  });

  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft', compensation_type: 'commission', requirements: [], benefits: [] },
  });

  const compensationType = watch('compensation_type');

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
        compensation_type: existing.compensation_type ?? 'commission',
        commission_rate:   existing.commission_rate ?? '',
        budget_amount:     existing.budget_amount ?? '',
        contract_duration: existing.contract_duration ?? '',
        status:            existing.status,
        requirements:      (existing.requirements ?? []).map((v) => ({ value: v })),
        benefits:          (existing.benefits ?? []).map((v) => ({ value: v })),
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      // Build FormData for multipart upload
      const fd = new FormData();
      fd.append('title',             data.title);
      fd.append('description',       data.description);
      fd.append('company_name',      data.company_name);
      fd.append('compensation_type', data.compensation_type);
      fd.append('status',            data.status);
      if (data.location)          fd.append('location',          data.location);
      if (data.sector)            fd.append('sector',            data.sector);
      if (data.mission_type)      fd.append('mission_type',      data.mission_type);
      if (data.contract_duration) fd.append('contract_duration', data.contract_duration);
      if (data.compensation_type === 'commission' && data.commission_rate !== '') {
        fd.append('commission_rate', String(data.commission_rate));
      }
      if (data.compensation_type === 'fixed_budget' && data.budget_amount !== '') {
        fd.append('budget_amount', String(data.budget_amount));
      }
      (data.requirements ?? []).forEach((r, i) => r.value && fd.append(`requirements[${i}]`, r.value));
      (data.benefits ?? []).forEach((b, i) => b.value && fd.append(`benefits[${i}]`, b.value));
      if (productSheetFile) fd.append('product_sheet', productSheetFile);

      if (isEdit) {
        fd.append('_method', 'PUT');
        return jobOfferApi.updateMultipart(id!, fd);
      }
      return jobOfferApi.createMultipart(fd);
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

          {/* Product sheet upload */}
          <FormField label="Product Sheet (PDF, DOCX, image — max 10MB)">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setProductSheetFile(e.target.files?.[0] ?? null)}
            />
            {productSheetFile ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
                <FileText size={15} className="text-primary-500 flex-shrink-0" />
                <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{productSheetFile.name}</span>
                <button type="button" onClick={() => { setProductSheetFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : existing?.product_sheet_name ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
                <FileText size={15} className="text-primary-500 flex-shrink-0" />
                <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{existing.product_sheet_name}</span>
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-primary-600 hover:underline">Replace</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
              >
                <Upload size={15} /> Upload product sheet
              </button>
            )}
          </FormField>
        </div>

        {/* Commercial terms */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Commercial Terms</h2>

          {/* Compensation type toggle */}
          <FormField label="Compensation Mode">
            <Controller
              control={control}
              name="compensation_type"
              render={({ field }) => (
                <div className="flex gap-2">
                  {(['commission', 'fixed_budget'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => field.onChange(type)}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        field.value === type
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {type === 'commission' ? '% Commission' : 'Fixed Budget'}
                    </button>
                  ))}
                </div>
              )}
            />
          </FormField>

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

            {compensationType === 'commission' ? (
              <FormField label="Commission Rate (%)" error={errors.commission_rate?.message}>
                <input {...register('commission_rate')} type="number" min="0" max="100" step="0.5" placeholder="e.g. 10" className={inputClass} />
              </FormField>
            ) : (
              <FormField label="Budget Amount (€)" error={errors.budget_amount?.message}>
                <input {...register('budget_amount')} type="number" min="0" step="100" placeholder="e.g. 5000" className={inputClass} />
              </FormField>
            )}
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
              <button type="button" onClick={() => removeReq(i)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
            </div>
          ))}
          {reqFields.length === 0 && <p className="text-xs text-gray-400">No requirements added yet.</p>}
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
              <button type="button" onClick={() => removeBen(i)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
            </div>
          ))}
          {benFields.length === 0 && <p className="text-xs text-gray-400">No benefits added yet.</p>}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">Failed to save. Please try again.</p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
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
