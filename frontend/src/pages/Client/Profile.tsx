import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../api/client';
import { Plus, Trash2, Loader2, CheckCircle, Upload, X, User } from 'lucide-react';
import { SECTORS } from './JobOfferForm';

// Accept URLs with or without protocol
const lenientUrl = z.string().transform((val) => {
  if (!val) return val;
  if (/^https?:\/\//i.test(val)) return val;
  return 'https://' + val;
}).pipe(z.string().url('Invalid URL')).or(z.literal(''));

const schema = z.object({
  title:            z.string().optional(),
  bio:              z.string().optional(),
  location:         z.string().optional(),
  availability:     z.string().optional(),
  experience_years: z.coerce.number().min(0).max(50).optional().or(z.literal('')),
  commission_rate:  z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  linkedin_url:     lenientUrl.optional(),
  is_published:     z.boolean().default(false),
  skills:           z.array(z.object({ value: z.string() })).optional(),
  expertise:        z.array(z.object({ value: z.string() })).optional(),
  sectors:          z.array(z.object({ value: z.string() })).optional(),
  achievements:     z.array(z.object({ value: z.string() })).optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 focus:border-primary-400 transition-all';

function TagArrayField({
  label, placeholder, fields, onAdd, onRemove, register: reg, fieldName,
}: {
  label: string; placeholder: string; fields: any[]; onAdd: () => void;
  onRemove: (i: number) => void; register: any; fieldName: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
        <button type="button" onClick={onAdd} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {fields.map((field, i) => (
          <div key={field.id} className="flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-2.5 py-1.5">
            <input
              {...reg(`${fieldName}.${i}.value`)}
              placeholder={placeholder}
              className="bg-transparent text-xs text-primary-700 dark:text-primary-300 outline-none w-28 placeholder-primary-400"
            />
            <button type="button" onClick={() => onRemove(i)} className="text-primary-400 hover:text-red-500 transition-colors ml-1">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {fields.length === 0 && <p className="text-xs text-gray-400">Click "Add" to add items</p>}
      </div>
    </div>
  );
}

export default function CommercialProfile() {
  const queryClient = useQueryClient();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: profileApi.getMyProfile,
  });

  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_published: false, skills: [], expertise: [], sectors: [], achievements: [] },
  });

  const { fields: skillFields, append: addSkill, remove: removeSkill } = useFieldArray({ control, name: 'skills' });
  const { fields: expFields, append: addExp, remove: removeExp } = useFieldArray({ control, name: 'expertise' });
  const { fields: sectorFields, append: addSector, remove: removeSector } = useFieldArray({ control, name: 'sectors' });
  const { fields: achFields, append: addAch, remove: removeAch } = useFieldArray({ control, name: 'achievements' });

  useEffect(() => {
    if (profile) {
      reset({
        title:            profile.title ?? '',
        bio:              profile.bio ?? '',
        location:         profile.location ?? '',
        availability:     profile.availability ?? '',
        experience_years: profile.experience_years ?? '',
        commission_rate:  profile.commission_rate ?? '',
        linkedin_url:     profile.linkedin_url ?? '',
        is_published:     profile.is_published ?? false,
        skills:           (profile.skills ?? []).map((v) => ({ value: v })),
        expertise:        (profile.expertise ?? []).map((v) => ({ value: v })),
        sectors:          (profile.sectors ?? []).map((v) => ({ value: v })),
        achievements:     (profile.achievements ?? []).map((v) => ({ value: v })),
      });
    }
  }, [profile, reset]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const fd = new globalThis.FormData();
      if (data.title)        fd.append('title', data.title);
      if (data.bio)          fd.append('bio', data.bio);
      if (data.location)     fd.append('location', data.location);
      if (data.availability) fd.append('availability', data.availability);
      if (data.linkedin_url) fd.append('linkedin_url', data.linkedin_url);
      if (data.experience_years !== '' && data.experience_years != null)
        fd.append('experience_years', String(data.experience_years));
      if (data.commission_rate !== '' && data.commission_rate != null)
        fd.append('commission_rate', String(data.commission_rate));
      fd.append('is_published', data.is_published ? '1' : '0');
      (data.skills ?? []).forEach((s, i) => s.value && fd.append(`skills[${i}]`, s.value));
      (data.expertise ?? []).forEach((e, i) => e.value && fd.append(`expertise[${i}]`, e.value));
      (data.sectors ?? []).forEach((s, i) => s.value && fd.append(`sectors[${i}]`, s.value));
      (data.achievements ?? []).forEach((a, i) => a.value && fd.append(`achievements[${i}]`, a.value));
      if (avatarFile) fd.append('avatar', avatarFile);
      return profileApi.upsertProfileMultipart(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setAvatarFile(null);
    },
  });

  const currentAvatar = avatarPreview ?? profile?.avatar_url ?? null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {profile ? 'Update your commercial profile' : 'Create your profile to get discovered by entreprises'}
          </p>
        </div>
        {profile?.is_published && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full font-medium">
            <CheckCircle size={13} /> Published
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutateAsync(data).catch(() => {}))} className="space-y-5">
        {/* Identity */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Identity</h2>

          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600">
                  <User size={24} />
                </div>
              )}
              {avatarFile && (
                <button
                  type="button"
                  onClick={() => { setAvatarFile(null); setAvatarPreview(null); if (avatarRef.current) avatarRef.current.value = ''; }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              >
                <Upload size={14} /> {currentAvatar ? 'Change photo' : 'Upload photo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF — max 5MB</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Professional Title</label>
            <input {...register('title')} placeholder="e.g. Senior Sales Representative" className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Bio</label>
            <textarea {...register('bio')} rows={3} placeholder="Describe your experience, approach, and goals..." className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Location</label>
              <input {...register('location')} placeholder="Paris, France" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Availability</label>
              <select {...register('availability')} className={`${inputClass} appearance-none`}>
                <option value="">Select...</option>
                <option value="immediate">Immediate</option>
                <option value="1month">In 1 month</option>
                <option value="freelance">Freelance</option>
                <option value="parttime">Part-time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Years of Experience</label>
              <input {...register('experience_years')} type="number" min="0" max="50" placeholder="e.g. 5" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Expected Commission (%)</label>
              <input {...register('commission_rate')} type="number" min="0" max="100" step="0.5" placeholder="e.g. 10" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">LinkedIn URL</label>
            <input {...register('linkedin_url')} placeholder="linkedin.com/in/yourname" className={inputClass} />
            {errors.linkedin_url && <p className="mt-1 text-xs text-red-600">{errors.linkedin_url.message}</p>}
            <p className="mt-1 text-xs text-gray-400">Paste with or without https://</p>
          </div>
        </div>

        {/* Skills & Expertise */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Skills & Expertise</h2>
          <TagArrayField label="Skills" placeholder="e.g. Negotiation" fields={skillFields} onAdd={() => addSkill({ value: '' })} onRemove={removeSkill} register={register} fieldName="skills" />
          <TagArrayField label="Expertise Areas" placeholder="e.g. SaaS Sales" fields={expFields} onAdd={() => addExp({ value: '' })} onRemove={removeExp} register={register} fieldName="expertise" />

          {/* Sectors with datalist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Sectors</label>
              <button type="button" onClick={() => addSector({ value: '' })} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sectorFields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-2.5 py-1.5">
                  <input
                    {...register(`sectors.${i}.value`)}
                    list="profile-sector-options"
                    placeholder="e.g. SaaS"
                    className="bg-transparent text-xs text-primary-700 dark:text-primary-300 outline-none w-28 placeholder-primary-400"
                  />
                  <button type="button" onClick={() => removeSector(i)} className="text-primary-400 hover:text-red-500 transition-colors ml-1"><Trash2 size={11} /></button>
                </div>
              ))}
              {sectorFields.length === 0 && <p className="text-xs text-gray-400">Click "Add" to add sectors</p>}
            </div>
            <datalist id="profile-sector-options">
              {SECTORS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Achievements</h2>
            <button type="button" onClick={() => addAch({ value: '' })} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
              <Plus size={12} /> Add
            </button>
          </div>
          {achFields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <input {...register(`achievements.${i}.value`)} placeholder="e.g. Closed 150% quota in Q3 2023" className={`${inputClass} flex-1`} />
              <button type="button" onClick={() => removeAch(i)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
          {achFields.length === 0 && <p className="text-xs text-gray-400">Highlight your top achievements to impress entreprises.</p>}
        </div>

        {/* Visibility */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Publish Profile</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Make your profile visible to entreprises searching for talent</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register('is_published')} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-600 after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
        </div>

        {mutation.isError && <p className="text-sm text-red-600 dark:text-red-400">Failed to save. Please try again.</p>}
        {mutation.isSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <CheckCircle size={15} /> Profile saved successfully!
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
