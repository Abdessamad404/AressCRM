import api from './axios';
import type {
  Profile, JobOffer, Quiz, QuizQuestion, QuizSubmission, QuizSubmissionResult, Message, Conversation, Paginated
} from '../types/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const flatPage = <T>(res: any): Paginated<T> => ({
  data: res.data,
  current_page: res.meta?.current_page ?? res.current_page ?? 1,
  last_page: res.meta?.last_page ?? res.last_page ?? 1,
  per_page: res.meta?.per_page ?? res.per_page ?? 15,
  total: res.meta?.total ?? res.total ?? 0,
});

// ─── Profile API ─────────────────────────────────────────────────────────────

export const profileApi = {
  getMyProfile: async (): Promise<Profile | null> => {
    const res = await api.get('/api/client/profile');
    return res.data.data;
  },

  upsertProfile: async (data: Partial<Profile>): Promise<Profile> => {
    const res = await api.post('/api/client/profile', data);
    return res.data.data;
  },

  listProfiles: async (params?: { sector?: string; location?: string; page?: number }): Promise<Paginated<Profile>> => {
    const res = await api.get('/api/client/profiles', { params });
    return flatPage<Profile>(res.data);
  },

  getProfile: async (id: string): Promise<Profile> => {
    const res = await api.get(`/api/client/profiles/${id}`);
    return res.data.data;
  },
};

// ─── Job Offers API ───────────────────────────────────────────────────────────

export const jobOfferApi = {
  list: async (params?: {
    sector?: string; mission_type?: string; search?: string; page?: number
  }): Promise<Paginated<JobOffer>> => {
    const res = await api.get('/api/client/job-offers', { params });
    return flatPage<JobOffer>(res.data);
  },

  get: async (id: string): Promise<JobOffer> => {
    const res = await api.get(`/api/client/job-offers/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<JobOffer>): Promise<JobOffer> => {
    const res = await api.post('/api/client/job-offers', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<JobOffer>): Promise<JobOffer> => {
    const res = await api.put(`/api/client/job-offers/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/client/job-offers/${id}`);
  },
};

// ─── Quiz API ─────────────────────────────────────────────────────────────────

export const quizApi = {
  list: async (params?: { page?: number }): Promise<Paginated<Quiz>> => {
    const res = await api.get('/api/client/quizzes', { params });
    return flatPage<Quiz>(res.data);
  },

  get: async (id: string): Promise<Quiz> => {
    const res = await api.get(`/api/client/quizzes/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<Quiz> & { questions?: Partial<QuizQuestion>[] }): Promise<Quiz> => {
    const res = await api.post('/api/client/quizzes', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Quiz>): Promise<Quiz> => {
    const res = await api.put(`/api/client/quizzes/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/client/quizzes/${id}`);
  },

  addQuestion: async (quizId: string, data: Partial<QuizQuestion>): Promise<QuizQuestion> => {
    const res = await api.post(`/api/client/quizzes/${quizId}/questions`, data);
    return res.data.data;
  },

  updateQuestion: async (quizId: string, questionId: string, data: Partial<QuizQuestion>): Promise<QuizQuestion> => {
    const res = await api.put(`/api/client/quizzes/${quizId}/questions/${questionId}`, data);
    return res.data.data;
  },

  deleteQuestion: async (quizId: string, questionId: string): Promise<void> => {
    await api.delete(`/api/client/quizzes/${quizId}/questions/${questionId}`);
  },

  submit: async (quizId: string, data: { answers?: Record<string, string>; essay_answer?: string }): Promise<QuizSubmissionResult> => {
    const res = await api.post(`/api/client/quizzes/${quizId}/submit`, data);
    return res.data.data;
  },

  getSubmissions: async (quizId: string, page = 1): Promise<Paginated<QuizSubmissionResult>> => {
    const res = await api.get(`/api/client/quizzes/${quizId}/submissions`, { params: { page } });
    return flatPage<QuizSubmissionResult>(res.data);
  },

  reviewSubmission: async (quizId: string, submissionId: string, data: { reviewer_notes?: string; score?: number }): Promise<QuizSubmission> => {
    const res = await api.patch(`/api/client/quizzes/${quizId}/submissions/${submissionId}/review`, data);
    return res.data.data;
  },

  mySubmissions: async (): Promise<Paginated<QuizSubmission>> => {
    const res = await api.get('/api/client/my-submissions');
    return flatPage<QuizSubmission>(res.data);
  },
};

// ─── Messages API ─────────────────────────────────────────────────────────────

export const messageApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get('/api/client/conversations');
    return res.data.data;
  },

  getThread: async (partnerId: string, page = 1): Promise<Paginated<Message>> => {
    const res = await api.get(`/api/client/messages/${partnerId}`, { params: { page } });
    return flatPage<Message>(res.data);
  },

  send: async (data: { receiver_id: string; content: string; job_offer_id?: string }): Promise<Message> => {
    const res = await api.post('/api/client/messages', data);
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get('/api/client/messages/unread-count');
    return res.data.count;
  },
};
