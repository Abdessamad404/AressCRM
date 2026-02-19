<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\JobOffer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    /**
     * POST /api/client/job-offers/{jobOffer}/apply
     * Commercial applies to a job offer.
     */
    public function apply(Request $request, JobOffer $jobOffer): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCommercial()) {
            return response()->json(['message' => 'Only commercial accounts can apply to job offers.'], 403);
        }

        if ($jobOffer->status !== 'published') {
            return response()->json(['message' => 'This job offer is not open for applications.'], 422);
        }

        if (Application::where('job_offer_id', $jobOffer->id)->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'You have already applied to this job offer.'], 422);
        }

        $validated = $request->validate([
            'cover_letter' => 'nullable|string|max:2000',
        ]);

        $application = Application::create([
            'job_offer_id' => $jobOffer->id,
            'user_id'      => $user->id,
            'cover_letter' => $validated['cover_letter'] ?? null,
            'status'       => 'pending',
        ]);

        return response()->json(['data' => $application->load(['jobOffer', 'user'])], 201);
    }

    /**
     * GET /api/client/job-offers/{jobOffer}/applications
     * Entreprise views all applications for their job offer.
     */
    public function index(Request $request, JobOffer $jobOffer): JsonResponse
    {
        $user = $request->user();

        if ($jobOffer->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $applications = Application::with(['user'])
            ->where('job_offer_id', $jobOffer->id)
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20);

        return response()->json($applications);
    }

    /**
     * PATCH /api/client/job-offers/{jobOffer}/applications/{application}
     * Entreprise updates application status / notes.
     */
    public function update(Request $request, JobOffer $jobOffer, Application $application): JsonResponse
    {
        $user = $request->user();

        if ($jobOffer->user_id !== $user->id || $application->job_offer_id !== $jobOffer->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'status'           => 'sometimes|in:pending,shortlisted,rejected,accepted',
            'entreprise_notes' => 'sometimes|nullable|string|max:1000',
        ]);

        $application->update($validated);

        return response()->json(['data' => $application->load(['user'])]);
    }

    /**
     * GET /api/client/my-applications
     * Commercial sees their own applications.
     */
    public function myApplications(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCommercial()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $applications = Application::with(['jobOffer.user'])
            ->where('user_id', $user->id)
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20);

        return response()->json($applications);
    }
}
