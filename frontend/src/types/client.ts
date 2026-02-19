// ─── Profile ──────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  user_id: string;
  // Shared
  bio: string | null;
  location: string | null;
  linkedin_url: string | null;
  sectors: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string; email: string };
  // Commercial fields
  title: string | null;
  skills: string[];
  expertise: string[];
  availability: string | null;
  experience_years: number | null;
  commission_rate: number | null;
  avatar_url: string | null;
  avatar_path: string | null;
  avatar_name: string | null;
  achievements: string[];
  // Entreprise fields
  company_name: string | null;
  company_website: string | null;
  company_size: string | null;
  company_logo_path: string | null;
  company_logo_name: string | null;
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
  compensation_type: 'commission' | 'fixed_budget';
  commission_rate: number | null;
  budget_amount: number | null;
  contract_duration: string | null;
  requirements: string[];
  benefits: string[];
  status: 'draft' | 'published' | 'closed';
  views_count: number;
  product_sheet_path: string | null;
  product_sheet_name: string | null;
  // computed by backend for commercial users
  has_applied?: boolean;
  application_status?: 'pending' | 'shortlisted' | 'rejected' | 'accepted' | null;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string; email: string };
  quizzes?: { id: string; title: string; description: string | null; time_limit_minutes: number | null }[];
}

// ─── Application ──────────────────────────────────────────────────────────────
export interface Application {
  id: string;
  job_offer_id: string;
  user_id: string;
  cover_letter: string | null;
  status: 'pending' | 'shortlisted' | 'rejected' | 'accepted';
  entreprise_notes: string | null;
  created_at: string;
  updated_at: string;
  job_offer?: JobOffer;
  user?: { id: string; name: string; email: string };
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

// ─── Quiz Submission Result (enriched response from submit endpoint) ──────────
export interface QuestionResult {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[] | null;
  correct_answer: string | null;   // null for short_answer
  user_answer: string | null;
  points: number;
  points_earned: number | null;    // null = pending review (short_answer)
  is_correct: boolean | null;      // null = pending review (short_answer)
}

export interface EssayResult {
  prompt: string;
  user_answer: string | null;
}

export interface QuizSubmissionResult extends QuizSubmission {
  percentage: number | null;       // null when no auto-gradeable questions
  passed: boolean | null;          // null when no auto-gradeable questions
  question_results: QuestionResult[];
  essay_result: EssayResult | null;
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
