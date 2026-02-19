import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../api/client';
import { Loader2, CheckCircle, Upload, X, Building2 } from 'lucide-react';
import { SECTORS } from './JobOfferForm';

const lenientUrl = z.string().transform((val) => {
  if (!val) return val;
  if (/^https?:\/\//i.test(val)) return val;
  return 'https://' + val;
}).pipe(z.string().url('Invalid URL')).or(z.literal(''));

const schema = z.object({
  company_name:     z.string().min(1, 'Company name is required'),
  bio:              z.string().optional(),
  company_website:  lenientUrl.optional(),
  company_size:     z.string().optional(),
  location:         z.string().optional(),
  linkedin_url:     lenientUrl.optional(),
  sector:           z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 focus:border-primary-400 transition-all';

export default function EntrepriseProfile() {
  const queryClient = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: profileApi.getMyProfile,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { company_name: '', bio: '', company_website: '', company_size: '', location: '', linkedin_url: '', sector: '' },
  });

  useEffect(() => {
    if (profile) {
      reset({
        company_name:    profile.company_name ?? '',
        bio:             profile.bio ?? '',
        company_website: profile.company_website ?? '',
        company_size:    profile.company_size ?? '',
        location:        profile.location ?? '',
        linkedin_url:    profile.linkedin_url ?? '',
        sector:          (profile.sectors ?? [])[0] ?? '',
      });
    }
  }, [profile, reset]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const fd = new globalThis.FormData();
      if (data.company_name)    fd.append('company_name', data.company_name);
      if (data.bio)             fd.append('bio', data.bio);
      if (data.company_website) fd.append('company_website', data.company_website);
      if (data.company_size)    fd.append('company_size', data.company_size);
      if (data.location)        fd.append('location', data.location);
      if (data.linkedin_url)    fd.append('linkedin_url', data.linkedin_url);
      if (data.sector)          fd.append('sectors[0]', data.sector);
      if (logoFile)             fd.append('logo', logoFile);
      return profileApi.upsertProfileMultipart(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setLogoFile(null);
    },
  });

  const currentLogo = logoPreview
    ?? (profile?.company_logo_path ? `/storage/${profile.company_logo_path}` : null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Your company information displayed to candidates
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutateAsync(data).catch(() => {}))} className="space-y-5">
        {/* Company identity */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Company Identity</h2>

          {/* Logo upload */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {currentLogo ? (
                <img src={currentLogo} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600">
                  <Building2 size={24} />
                </div>
              )}
              {logoFile && (
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); if (logoRef.current) logoRef.current.value = ''; }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              >
                <Upload size={14} /> {currentLogo ? 'Change logo' : 'Upload logo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5MB</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Company Name *</label>
            <input {...register('company_name')} placeholder="Acme Corp" className={inputClass} />
            {errors.company_name && <p className="mt-1 text-xs text-red-600">{errors.company_name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">About the company</label>
            <textarea {...register('bio')} rows={3} placeholder="Describe your company, culture, and mission..." className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Location</label>
              <input {...register('location')} placeholder="Paris, France" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Company Size</label>
              <select {...register('company_size')} className={`${inputClass} appearance-none`}>
                <option value="">Select...</option>
                <option value="1-10">1 – 10 employees</option>
                <option value="11-50">11 – 50 employees</option>
                <option value="51-200">51 – 200 employees</option>
                <option value="201-500">201 – 500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Website</label>
              <input {...register('company_website')} placeholder="yourcompany.com" className={inputClass} />
              {errors.company_website && <p className="mt-1 text-xs text-red-600">{errors.company_website.message}</p>}
              <p className="mt-1 text-xs text-gray-400">With or without https://</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">LinkedIn Page</label>
              <input {...register('linkedin_url')} placeholder="linkedin.com/company/..." className={inputClass} />
              {errors.linkedin_url && <p className="mt-1 text-xs text-red-600">{errors.linkedin_url.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Primary Sector</label>
            <input
              {...register('sector')}
              list="entreprise-sector-options"
              placeholder="Select or type your sector..."
              className={inputClass}
            />
            <datalist id="entreprise-sector-options">
              {SECTORS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
        </div>

        {mutation.isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to save. Please try again.</p>}
        {mutation.isSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <CheckCircle size={15} /> Company profile saved!
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Company Profile'}
        </button>
      </form>
    </div>
  );
}
