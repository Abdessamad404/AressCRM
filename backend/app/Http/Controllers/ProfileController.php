<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    /**
     * GET /api/client/profile
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
     * Accepts JSON only — file upload removed (Render uses ephemeral filesystem).
     */
    public function upsert(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isCommercial()) {
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
                'linkedin_url'     => 'nullable|string|max:500',
                'achievements'     => 'nullable|array',
                'achievements.*'   => 'string',
                'sectors'          => 'nullable|array',
                'sectors.*'        => 'string|max:100',
                'is_published'     => 'nullable|boolean',
            ]);

        } elseif ($user->isEntreprise()) {
            $validated = $request->validate([
                'company_name'    => 'nullable|string|max:255',
                'bio'             => 'nullable|string',
                'company_website' => 'nullable|string|max:500',
                'company_size'    => 'nullable|string|max:50',
                'location'        => 'nullable|string|max:255',
                'linkedin_url'    => 'nullable|string|max:500',
                'sectors'         => 'nullable|array',
                'sectors.*'       => 'string|max:100',
                'is_published'    => 'nullable|boolean',
            ]);

        } else {
            return response()->json(['message' => 'Only client accounts can manage profiles.'], 403);
        }

        $profile = Profile::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json(['data' => $profile], 200);
    }

    /**
     * GET /api/client/profiles
     * List published commercial profiles (for entreprise talent search)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Profile::with('user')
            ->where('is_published', true);

        if ($request->filled('sector')) {
            $query->where('sectors', 'like', '%' . $request->sector . '%');
        }

        if ($request->filled('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        $profiles = $query->orderByDesc('created_at')->paginate(15);

        return response()->json($profiles);
    }

    /**
     * GET /api/client/profiles/{profile}
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
