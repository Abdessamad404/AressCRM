// ─── Profile ──────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  user_id: string;
  title: string | null;
  bio: string | null;
  skills: string[];
  expertise: string[];
  location: string | null;
  availability: string | null;
  experience_years: number | null;
  commission_rate: number | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  achievements: string[];
  sectors: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string; email: string };
}

// ─── Job Offer ────────────────────────────────────────────────────────────────
export interface JobOffer {
  id: string;
  user_id: string;
  title: string;
  description: string;
  company_name: string;
  location: string | null;
  sector: string | null;
  mission_type: 'direct_sales' | 'lead_gen' | 'demo' | 'other' | null;
  commission_rate: number | null;
  contract_duration: string | null;
  requirements: string[];
  benefits: string[];
  status: 'draft' | 'published' | 'closed';
  views_count: number;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string; email: string };
  quizzes?: { id: string; title: string; description: string | null; time_limit_minutes: number | null }[];
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[] | null;
  correct_answer: string | null;
  points: number;
  order: number;
}

export interface Quiz {
  id: string;
  created_by_id: string;
  job_offer_id: string | null;
  title: string;
  description: string | null;
  essay_prompt: string | null;
  time_limit_minutes: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestion[];
  job_offer?: JobOffer;
  submissions_count?: number;
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: Record<string, string>;
  essay_answer: string | null;
  score: number | null;
  max_score: number | null;
  status: 'in_progress' | 'submitted' | 'reviewed';
  reviewer_notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  quiz?: Quiz;
  user?: { id: string; name: string; email: string };
}

// ─── Messaging ────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  job_offer_id: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: { id: string; name: string; client_type: string | null };
  receiver?: { id: string; name: string; client_type: string | null };
  job_offer?: { id: string; title: string } | null;
}

export interface Conversation {
  id: string;
  name: string;
  email: string;
  client_type: string | null;
  last_message: Message | null;
  unread_count: number;
}

// ─── Paginated ─────────────────────────────────────────────────────────────────
export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
