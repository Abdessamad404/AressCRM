<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class QuizController extends Controller
{
    // ─── Quiz CRUD (entreprise) ────────────────────────────────────────────────

    /**
     * GET /api/client/quizzes
     * Entreprise: list their own quizzes. Commercial: list published quizzes linked to job offers.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isEntreprise()) {
            $quizzes = Quiz::with(['jobOffer', 'questions'])
                ->where('created_by_id', $user->id)
                ->withCount('submissions')
                ->orderByDesc('created_at')
                ->paginate(12);
        } else {
            $quizzes = Quiz::with('jobOffer')
                ->where('is_published', true)
                ->orderByDesc('created_at')
                ->paginate(12);
        }

        return response()->json($quizzes);
    }

    /**
     * GET /api/client/quizzes/{quiz}
     */
    public function show(Request $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user();

        if (!$quiz->is_published && $quiz->created_by_id !== $user->id) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        $quiz->load(['questions', 'jobOffer', 'createdBy']);

        // Hide correct answers for commercials taking the quiz
        if ($user->isCommercial()) {
            $quiz->questions->each(function ($q) {
                unset($q->correct_answer);
            });
        }

        return response()->json(['data' => $quiz]);
    }

    /**
     * POST /api/client/quizzes
     * Create quiz (entreprise only)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isEntreprise()) {
            return response()->json(['message' => 'Only entreprise accounts can create quizzes.'], 403);
        }

        $validated = $request->validate([
            'job_offer_id'        => 'nullable|uuid|exists:job_offers,id',
            'title'               => 'required|string|max:255',
            'description'         => 'nullable|string',
            'essay_prompt'        => 'nullable|string',
            'time_limit_minutes'  => 'nullable|integer|min:1|max:360',
            'is_published'        => 'nullable|boolean',
            'questions'           => 'nullable|array',
            'questions.*.question'       => 'required|string',
            'questions.*.type'           => 'required|in:multiple_choice,true_false,short_answer',
            'questions.*.options'        => 'nullable|array',
            'questions.*.correct_answer' => 'nullable|string',
            'questions.*.points'         => 'nullable|integer|min:1',
            'questions.*.order'          => 'nullable|integer|min:0',
        ]);

        $quiz = Quiz::create([
            'created_by_id'      => $user->id,
            'job_offer_id'       => $validated['job_offer_id'] ?? null,
            'title'              => $validated['title'],
            'description'        => $validated['description'] ?? null,
            'essay_prompt'       => $validated['essay_prompt'] ?? null,
            'time_limit_minutes' => $validated['time_limit_minutes'] ?? null,
            'is_published'       => $validated['is_published'] ?? false,
        ]);

        // Create questions if provided
        if (!empty($validated['questions'])) {
            foreach ($validated['questions'] as $i => $qData) {
                QuizQuestion::create([
                    'quiz_id'        => $quiz->id,
                    'question'       => $qData['question'],
                    'type'           => $qData['type'],
                    'options'        => $qData['options'] ?? null,
                    'correct_answer' => $qData['correct_answer'] ?? null,
                    'points'         => $qData['points'] ?? 1,
                    'order'          => $qData['order'] ?? $i,
                ]);
            }
        }

        $quiz->load('questions');

        return response()->json(['data' => $quiz], 201);
    }

    /**
     * PUT /api/client/quizzes/{quiz}
     */
    public function update(Request $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user();

        if ($quiz->created_by_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'job_offer_id'       => 'nullable|uuid|exists:job_offers,id',
            'title'              => 'sometimes|string|max:255',
            'description'        => 'nullable|string',
            'essay_prompt'       => 'nullable|string',
            'time_limit_minutes' => 'nullable|integer|min:1|max:360',
            'is_published'       => 'nullable|boolean',
        ]);

        $quiz->update($validated);

        return response()->json(['data' => $quiz->fresh('questions')]);
    }

    /**
     * DELETE /api/client/quizzes/{quiz}
     */
    public function destroy(Request $request, Quiz $quiz): JsonResponse
    {
        if ($quiz->created_by_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $quiz->delete();

        return response()->json(null, 204);
    }

    // ─── Questions ────────────────────────────────────────────────────────────

    /**
     * POST /api/client/quizzes/{quiz}/questions
     */
    public function addQuestion(Request $request, Quiz $quiz): JsonResponse
    {
        if ($quiz->created_by_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'question'       => 'required|string',
            'type'           => 'required|in:multiple_choice,true_false,short_answer',
            'options'        => 'nullable|array',
            'correct_answer' => 'nullable|string',
            'points'         => 'nullable|integer|min:1',
            'order'          => 'nullable|integer|min:0',
        ]);

        $question = QuizQuestion::create(array_merge($validated, ['quiz_id' => $quiz->id]));

        return response()->json(['data' => $question], 201);
    }

    /**
     * PUT /api/client/quizzes/{quiz}/questions/{question}
     */
    public function updateQuestion(Request $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        if ($quiz->created_by_id !== $request->user()->id || $question->quiz_id !== $quiz->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'question'       => 'sometimes|string',
            'type'           => 'sometimes|in:multiple_choice,true_false,short_answer',
            'options'        => 'nullable|array',
            'correct_answer' => 'nullable|string',
            'points'         => 'nullable|integer|min:1',
            'order'          => 'nullable|integer|min:0',
        ]);

        $question->update($validated);

        return response()->json(['data' => $question]);
    }

    /**
     * DELETE /api/client/quizzes/{quiz}/questions/{question}
     */
    public function deleteQuestion(Request $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        if ($quiz->created_by_id !== $request->user()->id || $question->quiz_id !== $quiz->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $question->delete();

        return response()->json(null, 204);
    }

    // ─── Submissions (commercial takes quiz) ──────────────────────────────────

    /**
     * POST /api/client/quizzes/{quiz}/submit
     * Commercial submits answers
     */
    public function submit(Request $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCommercial()) {
            return response()->json(['message' => 'Only commercials can submit quizzes.'], 403);
        }

        if (!$quiz->is_published) {
            return response()->json(['message' => 'Quiz is not available.'], 403);
        }

        $validated = $request->validate([
            'answers'      => 'nullable|array',
            'essay_answer' => 'nullable|string',
        ]);

        // Auto-grade multiple choice / true_false questions
        $questions  = $quiz->questions;
        $maxScore   = 0;
        $score      = 0;
        $gradeable  = $questions->whereIn('type', ['multiple_choice', 'true_false']);

        foreach ($gradeable as $q) {
            $maxScore += $q->points;
            $answer    = $validated['answers'][$q->id] ?? null;
            if ($answer !== null && (string) $answer === (string) $q->correct_answer) {
                $score += $q->points;
            }
        }

        // short_answer only contributes to max, not auto-scored
        foreach ($questions->where('type', 'short_answer') as $q) {
            $maxScore += $q->points;
        }

        $submission = QuizSubmission::create([
            'quiz_id'      => $quiz->id,
            'user_id'      => $user->id,
            'answers'      => $validated['answers'] ?? [],
            'essay_answer' => $validated['essay_answer'] ?? null,
            'score'        => $score,
            'max_score'    => $maxScore,
            'status'       => 'submitted',
            'submitted_at' => Carbon::now(),
        ]);

        return response()->json(['data' => $submission], 201);
    }

    /**
     * GET /api/client/quizzes/{quiz}/submissions
     * Entreprise sees all submissions for their quiz
     */
    public function submissions(Request $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user();

        if ($quiz->created_by_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $submissions = QuizSubmission::with('user')
            ->where('quiz_id', $quiz->id)
            ->orderByDesc('submitted_at')
            ->paginate(20);

        return response()->json($submissions);
    }

    /**
     * PATCH /api/client/quizzes/{quiz}/submissions/{submission}/review
     * Entreprise reviews a submission (adds notes, sets reviewed status)
     */
    public function reviewSubmission(Request $request, Quiz $quiz, QuizSubmission $submission): JsonResponse
    {
        $user = $request->user();

        if ($quiz->created_by_id !== $user->id || $submission->quiz_id !== $quiz->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'reviewer_notes' => 'nullable|string',
            'score'          => 'nullable|integer|min:0',
        ]);

        $submission->update(array_merge($validated, ['status' => 'reviewed']));

        return response()->json(['data' => $submission]);
    }

    /**
     * GET /api/client/my-submissions
     * Commercial sees their own submissions
     */
    public function mySubmissions(Request $request): JsonResponse
    {
        $submissions = QuizSubmission::with('quiz')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('submitted_at')
            ->paginate(15);

        return response()->json($submissions);
    }
}
