<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\JobOffer;
use App\Models\Message;
use App\Models\QuizSubmission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::orderBy('role', 'asc')   // 'admin' sorts before 'user' alphabetically
            ->orderBy('name')
            ->get();

        return response()->json(['data' => UserResource::collection($users)]);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(['data' => new UserResource($user)]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();

        // Clients (commercial/entreprise) cannot be promoted/demoted as admins
        if ($user->client_type !== null) {
            return response()->json(['message' => 'Client accounts cannot have their role changed here.'], 403);
        }

        // Prevent demoting the last admin
        if (
            isset($request->role) &&
            $request->role !== 'admin' &&
            $user->role === 'admin' &&
            User::where('role', 'admin')->count() <= 1
        ) {
            return response()->json(['message' => 'Cannot demote the only admin.'], 422);
        }

        $data = $request->validate([
            'name'             => ['sometimes', 'required', 'string', 'max:255'],
            'email'            => ['sometimes', 'required', 'email', 'unique:users,email,' . $user->id],
            'role'             => ['sometimes', 'in:admin,user'],
            'theme_preference' => ['sometimes', 'in:light,dark,system'],
        ]);

        $user->update($data);

        return response()->json(['data' => new UserResource($user)]);
    }

    /**
     * Admin view: progress between an entreprise user and their candidates.
     * For entreprise: returns job offers + quiz submissions on those offers.
     * For commercial: returns quiz submissions + messages sent/received.
     */
    public function progress(User $user): JsonResponse
    {
        if ($user->client_type === 'entreprise') {
            $jobOffers = JobOffer::with(['quizzes.submissions.user'])
                ->where('user_id', $user->id)
                ->latest()
                ->get()
                ->map(function ($offer) {
                    $submissions = $offer->quizzes->flatMap(fn($q) => $q->submissions)->map(fn($s) => [
                        'id'             => $s->id,
                        'candidate_name' => $s->user?->name,
                        'candidate_email'=> $s->user?->email,
                        'quiz_title'     => $s->quiz?->title ?? '—',
                        'submitted_at'   => $s->submitted_at,
                        'percentage'     => null, // enriched at frontend if needed
                    ]);

                    return [
                        'id'               => $offer->id,
                        'title'            => $offer->title,
                        'status'           => $offer->status,
                        'quiz_count'       => $offer->quizzes->count(),
                        'submission_count' => $submissions->count(),
                        'submissions'      => $submissions->values(),
                    ];
                });

            return response()->json(['data' => [
                'user'       => new UserResource($user),
                'type'       => 'entreprise',
                'job_offers' => $jobOffers,
                'totals'     => [
                    'job_offers'  => $jobOffers->count(),
                    'submissions' => $jobOffers->sum('submission_count'),
                ],
            ]]);
        }

        if ($user->client_type === 'commercial') {
            $submissions = QuizSubmission::with(['quiz.jobOffer.user'])
                ->where('user_id', $user->id)
                ->latest()
                ->get()
                ->map(fn($s) => [
                    'id'               => $s->id,
                    'quiz_title'       => $s->quiz?->title ?? '—',
                    'job_offer_title'  => $s->quiz?->jobOffer?->title ?? '—',
                    'entreprise_name'  => $s->quiz?->jobOffer?->user?->name ?? '—',
                    'submitted_at'     => $s->submitted_at,
                ]);

            $messageCount = Message::where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id)
                ->count();

            $partners = Message::where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id)
                ->with(['sender', 'receiver'])
                ->get()
                ->map(fn($m) => $m->sender_id === $user->id ? $m->receiver : $m->sender)
                ->filter()
                ->unique('id')
                ->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'client_type' => $u->client_type])
                ->values();

            return response()->json(['data' => [
                'user'          => new UserResource($user),
                'type'          => 'commercial',
                'submissions'   => $submissions,
                'message_count' => $messageCount,
                'partners'      => $partners,
                'totals'        => [
                    'submissions' => $submissions->count(),
                    'messages'    => $messageCount,
                    'partners'    => $partners->count(),
                ],
            ]]);
        }

        return response()->json(['message' => 'User is not a client.'], 422);
    }

    public function updateTheme(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id !== $user->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate(['theme_preference' => ['required', 'in:light,dark,system']]);
        $user->update(['theme_preference' => $request->theme_preference]);

        return response()->json(['data' => new UserResource($user)]);
    }
}
