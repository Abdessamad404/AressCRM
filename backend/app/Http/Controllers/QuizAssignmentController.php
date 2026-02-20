<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Quiz;
use App\Models\QuizAssignment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class QuizAssignmentController extends Controller
{
    /**
     * GET /api/client/applications/{application}/quiz-assignments
     * Entreprise: list quizzes assigned to a specific applicant.
     */
    public function listForApplication(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        // Only the entreprise that owns the job offer can see assignments
        if (!$user->isEntreprise() || $application->jobOffer->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $assignments = QuizAssignment::with(['quiz:id,title,description,time_limit_minutes,is_published'])
            ->where('application_id', $application->id)
            ->orderBy('assigned_at')
            ->get();

        return response()->json(['data' => $assignments]);
    }

    /**
     * POST /api/client/applications/{application}/quiz-assignments
     * Entreprise: assign one of their quizzes to a specific applicant.
     *
     * Body: { quiz_id: uuid }
     */
    public function assign(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        if (!$user->isEntreprise() || $application->jobOffer->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Cannot assign to rejected applicants
        if ($application->status === 'rejected') {
            return response()->json(['message' => 'Cannot assign a quiz to a rejected applicant.'], 422);
        }

        $validated = $request->validate([
            'quiz_id' => 'required|uuid|exists:quizzes,id',
        ]);

        // Quiz must belong to this entreprise
        $quiz = Quiz::find($validated['quiz_id']);
        if ($quiz->created_by_id !== $user->id) {
            return response()->json(['message' => 'You can only assign your own quizzes.'], 403);
        }

        // Prevent duplicates (also enforced at DB level)
        $existing = QuizAssignment::where('quiz_id', $quiz->id)
            ->where('application_id', $application->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'This quiz is already assigned to this applicant.'], 422);
        }

        $assignment = QuizAssignment::create([
            'quiz_id'        => $quiz->id,
            'application_id' => $application->id,
            'assigned_by_id' => $user->id,
        ]);

        $assignment->load('quiz:id,title,description,time_limit_minutes,is_published');

        return response()->json(['data' => $assignment], 201);
    }

    /**
     * DELETE /api/client/applications/{application}/quiz-assignments/{assignment}
     * Entreprise: remove a quiz assignment.
     */
    public function unassign(Request $request, Application $application, QuizAssignment $assignment): JsonResponse
    {
        $user = $request->user();

        if (!$user->isEntreprise() || $application->jobOffer->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Ensure the assignment actually belongs to this application
        if ($assignment->application_id !== $application->id) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $assignment->delete();

        return response()->json(null, 204);
    }
}
