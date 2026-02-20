<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

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
     * Works for both commercial and entreprise users.
     */
    public function upsert(Request $request): JsonResponse
    {
        $user = $request->user();

        // Debug: log what PHP sees about the uploaded file
        \Illuminate\Support\Facades\Log::info('Profile upsert called', [
            'has_avatar'    => $request->hasFile('avatar'),
            'has_logo'      => $request->hasFile('logo'),
            'content_type'  => $request->header('Content-Type'),
            'files'         => array_keys($request->allFiles()),
            'is_commercial' => $user->isCommercial(),
            'is_entreprise' => $user->isEntreprise(),
            'storage_root'  => storage_path('app/public'),
            'storage_writable' => is_writable(storage_path('app/public')),
            'avatars_exists' => file_exists(storage_path('app/public/avatars')),
            'avatars_writable' => is_writable(storage_path('app/public/avatars')),
            'symlink_exists' => file_exists(public_path('storage')),
            'symlink_is_link' => is_link(public_path('storage')),
        ]);

        try {

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
                'avatar'           => 'nullable|file|image|max:5120',
                'achievements'     => 'nullable|array',
                'achievements.*'   => 'string',
                'sectors'          => 'nullable|array',
                'sectors.*'        => 'string|max:100',
                'is_published'     => 'nullable|boolean',
            ]);

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $existing = $user->profile;
                if ($existing?->avatar_path) {
                    Storage::disk('public')->delete($existing->avatar_path);
                }
                $path = $request->file('avatar')->store('avatars', 'public');
                $validated['avatar_path'] = $path;
                $validated['avatar_name'] = $request->file('avatar')->getClientOriginalName();
                $validated['avatar_url']  = '/storage/' . $path;
            }

            unset($validated['avatar']);
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
                'logo'            => 'nullable|file|image|max:5120',
                'is_published'    => 'nullable|boolean',
            ]);

            // Handle logo upload
            if ($request->hasFile('logo')) {
                $existing = $user->profile;
                if ($existing?->company_logo_path) {
                    Storage::disk('public')->delete($existing->company_logo_path);
                }
                $path = $request->file('logo')->store('logos', 'public');
                $validated['company_logo_path'] = $path;
                $validated['company_logo_name'] = $request->file('logo')->getClientOriginalName();
            }

            unset($validated['logo']);
        } else {
            return response()->json(['message' => 'Only client accounts can manage profiles.'], 403);
        }

        $profile = Profile::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json(['data' => $profile], 200);

        } catch (\Throwable $e) {
            // Temporary debug: return the real exception so we can see what's failing
            return response()->json([
                'error'   => get_class($e),
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'trace'   => array_slice(
                    array_map(fn($f) => ($f['file'] ?? '?') . ':' . ($f['line'] ?? '?'), $e->getTrace()),
                    0, 5
                ),
            ], 500);
        }
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
