<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    /**
     * GET /api/client/profile
     * Get the authenticated commercial's own profile
     */
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->profile;

        if (!$profile) {
            return response()->json(['data' => null], 200);
        }

        return response()->json(['data' => $profile]);
    }

    /**
     * POST /api/client/profile
     * Create or update the authenticated commercial's profile
     */
    public function upsert(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCommercial()) {
            return response()->json(['message' => 'Only commercials can manage profiles.'], 403);
        }

        $validated = $request->validate([
            'title'            => 'nullable|string|max:255',
            'bio'              => 'nullable|string',
            'skills'           => 'nullable|array',
            'skills.*'         => 'string|max:100',
            'expertise'        => 'nullable|array',
            'expertise.*'      => 'string|max:100',
            'location'         => 'nullable|string|max:255',
            'availability'     => 'nullable|string|max:100',
            'experience_years' => 'nullable|integer|min:0|max:50',
            'commission_rate'  => 'nullable|numeric|min:0|max:100',
            'linkedin_url'     => 'nullable|url|max:500',
            'avatar_url'       => 'nullable|url|max:500',
            'achievements'     => 'nullable|array',
            'achievements.*'   => 'string',
            'sectors'          => 'nullable|array',
            'sectors.*'        => 'string|max:100',
            'is_published'     => 'nullable|boolean',
        ]);

        $profile = Profile::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json(['data' => $profile], 200);
    }

    /**
     * GET /api/client/profiles
     * List published commercial profiles (for entreprises to browse)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Profile::with('user')
            ->where('is_published', true);

        if ($request->has('sector')) {
            $query->whereJsonContains('sectors', $request->sector);
        }

        if ($request->has('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        $profiles = $query->orderByDesc('created_at')->paginate(15);

        return response()->json($profiles);
    }

    /**
     * GET /api/client/profiles/{profile}
     * View a single commercial profile publicly
     */
    public function showPublic(Profile $profile): JsonResponse
    {
        if (!$profile->is_published) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        $profile->load('user');

        return response()->json(['data' => $profile]);
    }
}
