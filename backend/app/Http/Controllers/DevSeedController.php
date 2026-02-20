<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\JobOffer;
use App\Models\Quiz;
use App\Models\QuizAssignment;
use App\Models\QuizQuestion;
use App\Models\QuizSubmission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Dev/Demo seed endpoint — admin-only, safe to deploy to production.
 *
 * POST /api/dev/seed
 *   → Wipes all content (job offers, quizzes, applications, assignments,
 *     submissions) then recreates realistic demo data from existing users.
 *     Users themselves are never touched.
 */
class DevSeedController extends Controller
{
    public function seed(Request $request): JsonResponse
    {
        // ── 1. Resolve seeded users ───────────────────────────────────────────
        $entreprises = User::where('client_type', 'entreprise')->get();
        $commercials  = User::where('client_type', 'commercial')->get();

        if ($entreprises->isEmpty() || $commercials->isEmpty()) {
            return response()->json([
                'error' => 'No entreprise or commercial users found. Run `php artisan db:seed` first to create users.',
            ], 422);
        }

        // ── 2. Wipe existing content (DELETE works on both SQLite and MySQL) ──
        QuizAssignment::query()->delete();
        QuizSubmission::query()->delete();
        Application::query()->delete();
        QuizQuestion::query()->delete();
        Quiz::query()->delete();
        JobOffer::query()->delete();

        // ── 3. Job offer templates (2 per entreprise) ────────────────────────
        $offerTemplates = [
            [
                'title'             => 'Senior B2B Sales Representative',
                'description'       => "We are looking for a driven B2B sales professional to expand our enterprise client base.\n\nYou will manage the full sales cycle — from prospecting and qualifying leads to closing and onboarding. You'll be working closely with our product and marketing teams to craft compelling proposals.\n\nThis is a high-autonomy role with uncapped commission.",
                'sector'            => 'tech',
                'mission_type'      => 'direct_sales',
                'compensation_type' => 'commission',
                'commission_rate'   => '12.00',
                'contract_duration' => '6 months',
                'location'          => 'Remote',
                'requirements'      => ['3+ years B2B sales experience', 'Excellent communication skills', 'CRM proficiency (Salesforce or HubSpot)', 'Proven track record of hitting quota'],
                'benefits'          => ['Uncapped commission', 'Flexible hours', 'Performance bonuses', 'Remote-first'],
                'status'            => 'published',
            ],
            [
                'title'             => 'Business Development Manager – SaaS',
                'description'       => "Join our rapidly growing SaaS company as a Business Development Manager.\n\nYou will identify new market opportunities, build strategic partnerships, and close mid-market deals. The ideal candidate is consultative, data-driven, and comfortable navigating complex buying committees.\n\nCompetitive fixed budget + bonus structure.",
                'sector'            => 'tech',
                'mission_type'      => 'lead_gen',
                'compensation_type' => 'fixed_budget',
                'budget_amount'     => '4500.00',
                'contract_duration' => '3 months',
                'location'          => 'Paris, France',
                'requirements'      => ['Experience in SaaS sales', 'Strong negotiation skills', 'Ability to manage a pipeline of 50+ leads', 'French & English fluency'],
                'benefits'          => ['Fixed monthly budget', 'Quarterly performance bonus', 'Full equipment provided'],
                'status'            => 'published',
            ],
            [
                'title'             => 'Field Sales Executive – SME Market',
                'description'       => "We need an energetic field sales executive to develop our SME customer base in your region.\n\nYou will attend client meetings, present our solution suite, and build long-term relationships. Training and onboarding provided. Weekly team syncs to share best practices.",
                'sector'            => 'finance',
                'mission_type'      => 'demo',
                'compensation_type' => 'commission',
                'commission_rate'   => '8.50',
                'contract_duration' => '12 months',
                'location'          => 'Lyon, France',
                'requirements'      => ['Experience in field/outside sales', 'Valid driving licence', 'Self-motivated and target-driven', 'Strong local network a plus'],
                'benefits'          => ['Vehicle allowance', 'Phone & laptop', 'Full training programme'],
                'status'            => 'published',
            ],
            [
                'title'             => 'Inside Sales Account Executive',
                'description'       => "We are expanding our inside sales team and looking for a motivated Account Executive to handle inbound qualified leads and drive upsell revenue from existing accounts.\n\nYou will work within a structured sales methodology, supported by robust tooling and a dedicated SDR team feeding you warm leads.",
                'sector'            => 'retail',
                'mission_type'      => 'direct_sales',
                'compensation_type' => 'fixed_budget',
                'budget_amount'     => '3200.00',
                'contract_duration' => '6 months',
                'location'          => 'Remote',
                'requirements'      => ['1–3 years inside sales experience', 'Comfortable with high call volume', 'Experience with CRM tools', 'Organised and process-driven'],
                'benefits'          => ['Stable monthly budget', 'Monthly commission top-up', 'Remote-friendly', 'Health insurance'],
                'status'            => 'published',
            ],
        ];

        // ── 4. Quiz templates (1 per entreprise) ─────────────────────────────
        $quizTemplates = [
            [
                'title'       => 'Sales Fundamentals Assessment',
                'description' => 'Test your core understanding of B2B sales processes and methodology.',
                'essay_prompt' => 'Describe a deal you are proud of closing. What was the challenge, and how did you overcome it?',
                'time_limit_minutes' => 20,
                'is_published' => true,
                'questions'   => [
                    ['question' => 'What does BANT stand for in sales qualification?', 'type' => 'multiple_choice', 'options' => ['Budget, Authority, Need, Timeline', 'Business, Action, Negotiation, Target', 'Buyer, Approach, Network, Territory', 'None of the above'], 'correct_answer' => '0', 'points' => 2],
                    ['question' => 'A prospect says "your price is too high." What is the best response?', 'type' => 'multiple_choice', 'options' => ['Offer an immediate discount', 'Explore the value gap and understand their budget constraints', 'End the call politely', 'Insist on the price'], 'correct_answer' => '1', 'points' => 3],
                    ['question' => 'Cold calling is completely dead in modern B2B sales.', 'type' => 'true_false', 'options' => null, 'correct_answer' => 'False', 'points' => 1],
                ],
            ],
            [
                'title'       => 'SaaS Sales Knowledge Check',
                'description' => 'Evaluate your knowledge of SaaS sales cycles, metrics, and customer success.',
                'essay_prompt' => 'How would you handle a renewal call with a customer who is considering churning?',
                'time_limit_minutes' => 15,
                'is_published' => true,
                'questions'   => [
                    ['question' => 'What does ARR stand for?', 'type' => 'multiple_choice', 'options' => ['Annual Recurring Revenue', 'Average Retention Rate', 'Annualised Revenue Report', 'Account Revenue Ratio'], 'correct_answer' => '0', 'points' => 1],
                    ['question' => 'Which metric best indicates if a SaaS customer will renew?', 'type' => 'multiple_choice', 'options' => ['Gross margin', 'Product usage / feature adoption', 'NPS score alone', 'Contract length'], 'correct_answer' => '1', 'points' => 2],
                    ['question' => 'A shorter sales cycle always means a better deal for the vendor.', 'type' => 'true_false', 'options' => null, 'correct_answer' => 'False', 'points' => 1],
                ],
            ],
            [
                'title'       => 'Field Sales Aptitude Test',
                'description' => 'Assess practical field sales skills including territory management and objection handling.',
                'essay_prompt' => null,
                'time_limit_minutes' => 10,
                'is_published' => true,
                'questions'   => [
                    ['question' => 'What is the main goal of a discovery call?', 'type' => 'multiple_choice', 'options' => ['Present your product immediately', 'Understand the prospect\'s pain points and goals', 'Schedule the demo', 'Close the deal'], 'correct_answer' => '1', 'points' => 2],
                    ['question' => 'Territory management in field sales means focusing only on the easiest accounts.', 'type' => 'true_false', 'options' => null, 'correct_answer' => 'False', 'points' => 1],
                    ['question' => 'Name one key performance indicator you track weekly as a field sales rep.', 'type' => 'short_answer', 'options' => null, 'correct_answer' => null, 'points' => 2],
                ],
            ],
            [
                'title'       => 'Inside Sales Skills Assessment',
                'description' => 'Test inside sales best practices, objection handling, and pipeline management.',
                'essay_prompt' => 'Walk us through how you manage your daily pipeline when you have 60+ active opportunities.',
                'time_limit_minutes' => 15,
                'is_published' => true,
                'questions'   => [
                    ['question' => 'How many follow-up touches does it take on average to get a response from a cold prospect?', 'type' => 'multiple_choice', 'options' => ['1–2', '3–4', '5–8', '10+'], 'correct_answer' => '2', 'points' => 2],
                    ['question' => 'Social selling replaces traditional outreach completely.', 'type' => 'true_false', 'options' => null, 'correct_answer' => 'False', 'points' => 1],
                    ['question' => 'What does "pipeline velocity" measure?', 'type' => 'multiple_choice', 'options' => ['How fast deals move through the funnel', 'Number of calls per day', 'Customer satisfaction score', 'Average contract value'], 'correct_answer' => '0', 'points' => 2],
                ],
            ],
        ];

        // ── 5. Create offers + quizzes per entreprise ─────────────────────────
        $createdOffers = [];
        $createdQuizzes = [];
        $offerCount = 0;
        $quizCount  = 0;

        foreach ($entreprises as $i => $entreprise) {
            // Two offers per entreprise (cycle through templates in pairs)
            $t1 = $offerTemplates[($i * 2) % count($offerTemplates)];
            $t2 = $offerTemplates[($i * 2 + 1) % count($offerTemplates)];

            foreach ([$t1, $t2] as $template) {
                $offer = JobOffer::create(array_merge($template, [
                    'user_id'      => $entreprise->id,
                    'company_name' => $entreprise->company ?? $entreprise->name,
                ]));
                $createdOffers[] = $offer;
                $offerCount++;
            }

            // One quiz per entreprise
            $qt = $quizTemplates[$i % count($quizTemplates)];
            $quiz = Quiz::create([
                'created_by_id'      => $entreprise->id,
                'title'              => $qt['title'],
                'description'        => $qt['description'],
                'essay_prompt'       => $qt['essay_prompt'],
                'time_limit_minutes' => $qt['time_limit_minutes'],
                'is_published'       => $qt['is_published'],
            ]);

            foreach ($qt['questions'] as $order => $q) {
                QuizQuestion::create([
                    'quiz_id'        => $quiz->id,
                    'question'       => $q['question'],
                    'type'           => $q['type'],
                    'options'        => $q['options'],
                    'correct_answer' => $q['correct_answer'],
                    'points'         => $q['points'],
                    'order'          => $order + 1,
                ]);
            }

            $createdQuizzes[$entreprise->id] = $quiz;
            $quizCount++;
        }

        // ── 6. Create applications (commercials apply to offers) ──────────────
        // Distribute: each commercial applies to 2–3 offers, mix of statuses
        $statuses    = ['pending', 'pending', 'shortlisted', 'accepted', 'rejected'];
        $appCount    = 0;
        $createdApps = []; // keyed by "offer_id|user_id" for quiz assignment lookup

        foreach ($commercials as $ci => $commercial) {
            // Each commercial applies to 2 offers (offset by commercial index)
            $offerSlice = array_slice($createdOffers, ($ci * 2) % count($createdOffers), 2, true);

            foreach ($offerSlice as $oi => $offer) {
                $status = $statuses[($ci + $oi) % count($statuses)];
                $app = Application::create([
                    'job_offer_id' => $offer->id,
                    'user_id'      => $commercial->id,
                    'cover_letter' => $this->coverLetter($commercial->name),
                    'status'       => $status,
                ]);
                $createdApps[] = ['app' => $app, 'offer' => $offer, 'status' => $status];
                $appCount++;
            }
        }

        // ── 7. Assign quizzes to shortlisted/accepted applications ────────────
        $assignCount = 0;
        foreach ($createdApps as $entry) {
            if (!in_array($entry['status'], ['shortlisted', 'accepted'])) {
                continue;
            }

            $offer = $entry['offer'];
            $app   = $entry['app'];

            // Find which entreprise owns this offer, use their quiz
            $quiz = $createdQuizzes[$offer->user_id] ?? null;
            if (!$quiz) continue;

            // Avoid duplicate assignments (unique constraint on quiz_id + application_id)
            $alreadyAssigned = QuizAssignment::where('quiz_id', $quiz->id)
                ->where('application_id', $app->id)
                ->exists();

            if (!$alreadyAssigned) {
                QuizAssignment::create([
                    'quiz_id'        => $quiz->id,
                    'application_id' => $app->id,
                    'assigned_by_id' => $offer->user_id,
                    'assigned_at'    => now(),
                ]);
                $assignCount++;
            }
        }

        // ── 8. Return summary ─────────────────────────────────────────────────
        return response()->json([
            'message' => 'Demo data reset and reseeded successfully.',
            'summary' => [
                'entreprises'        => $entreprises->count(),
                'commercials'        => $commercials->count(),
                'job_offers_created' => $offerCount,
                'quizzes_created'    => $quizCount,
                'applications_created' => $appCount,
                'quiz_assignments_created' => $assignCount,
            ],
        ]);
    }

    /**
     * GET /api/dev/wipe — nuke all content, keep users only. Fresh start.
     */
    public function wipe(): JsonResponse
    {
        try {
            QuizAssignment::query()->delete();
            QuizSubmission::query()->delete();
            Application::query()->delete();
            QuizQuestion::query()->delete();
            Quiz::query()->delete();
            JobOffer::query()->delete();

            return response()->json(['message' => 'Wiped. Users intact, everything else gone.']);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generate a short personalised cover letter for seeded applications.
     */
    private function coverLetter(string $name): string
    {
        $intros = [
            "Hi, I'm {name} and I'm very interested in this opportunity.",
            "My name is {name} and I believe my background is a strong match for this role.",
            "I'm {name}, a sales professional with a passion for building lasting client relationships.",
            "Hello, I'm {name}. I've been following your company and would love to contribute to your growth.",
        ];
        $idx = crc32($name) % count($intros);
        return str_replace('{name}', $name, $intros[abs($idx)]);
    }
}
