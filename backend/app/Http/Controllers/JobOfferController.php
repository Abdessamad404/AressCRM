<?php

namespace App\Http\Controllers;

use App\Models\JobOffer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class JobOfferController extends Controller
{
    /**
     * GET /api/client/job-offers
     * List job offers — commercials see published ones, entreprises see their own
     */
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = JobOffer::with('user');

        if ($user->isEntreprise()) {
            $query->where('user_id', $user->id);
        } else {
            $query->where('status', 'published');
        }

        if ($request->filled('sector')) {
            $query->where('sector', $request->sector);
        }

        if ($request->filled('mission_type')) {
            $query->where('mission_type', $request->mission_type);
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                  ->orWhere('description', 'like', "%{$term}%")
                  ->orWhere('company_name', 'like', "%{$term}%");
            });
        }

        $offers = $query->orderByDesc('created_at')->paginate(12);

        return response()->json($offers);
    }

    /**
     * GET /api/client/job-offers/{jobOffer}
     * View a single job offer
     */
    public function show(Request $request, JobOffer $jobOffer): JsonResponse
    {
        $user = $request->user();

        if ($jobOffer->status !== 'published' && $jobOffer->user_id !== $user->id) {
            return response()->json(['message' => 'Job offer not found.'], 404);
        }

        if ($jobOffer->user_id !== $user->id) {
            $jobOffer->increment('views_count');
        }

        $jobOffer->load(['user', 'quizzes' => function ($q) {
            $q->where('is_published', true)->select('id', 'title', 'description', 'time_limit_minutes');
        }]);

        return response()->json(['data' => $jobOffer]);
    }

    /**
     * POST /api/client/job-offers
     * Create a new job offer (entreprise only)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isEntreprise()) {
            return response()->json(['message' => 'Only entreprise accounts can post job offers.'], 403);
        }

        $validated = $request->validate([
            'title'             => 'required|string|max:255',
            'description'       => 'required|string',
            'company_name'      => 'required|string|max:255',
            'location'          => 'nullable|string|max:255',
            'sector'            => 'nullable|string|max:100',
            'mission_type'      => 'nullable|string|in:direct_sales,lead_gen,demo,other',
            'commission_rate'   => 'nullable|numeric|min:0|max:100',
            'contract_duration' => 'nullable|string|max:50',
            'requirements'      => 'nullable|array',
            'requirements.*'    => 'string',
            'benefits'          => 'nullable|array',
            'benefits.*'        => 'string',
            'status'            => 'nullable|in:draft,published,closed',
        ]);

        $offer = JobOffer::create(array_merge($validated, [
            'user_id' => $user->id,
            'status'  => $validated['status'] ?? 'draft',
        ]));

        return response()->json(['data' => $offer], 201);
    }

    /**
     * PUT /api/client/job-offers/{jobOffer}
     * Update a job offer (owner entreprise only)
     */
    public function update(Request $request, JobOffer $jobOffer): JsonResponse
    {
        $user = $request->user();

        if ($jobOffer->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'title'             => 'sometimes|string|max:255',
            'description'       => 'sometimes|string',
            'company_name'      => 'sometimes|string|max:255',
            'location'          => 'nullable|string|max:255',
            'sector'            => 'nullable|string|max:100',
            'mission_type'      => 'nullable|string|in:direct_sales,lead_gen,demo,other',
            'commission_rate'   => 'nullable|numeric|min:0|max:100',
            'contract_duration' => 'nullable|string|max:50',
            'requirements'      => 'nullable|array',
            'requirements.*'    => 'string',
            'benefits'          => 'nullable|array',
            'benefits.*'        => 'string',
            'status'            => 'nullable|in:draft,published,closed',
        ]);

        $jobOffer->update($validated);

        return response()->json(['data' => $jobOffer]);
    }

    /**
     * DELETE /api/client/job-offers/{jobOffer}
     * Delete a job offer (owner only)
     */
    public function destroy(Request $request, JobOffer $jobOffer): JsonResponse
    {
        if ($jobOffer->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $jobOffer->delete();

        return response()->json(null, 204);
    }
}
