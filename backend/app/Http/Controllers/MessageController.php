<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class MessageController extends Controller
{
    /**
     * GET /api/client/conversations
     * Return a list of unique conversation partners for the current user
     */
    public function conversations(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Get unique partner IDs
        $sentTo   = Message::where('sender_id', $userId)->distinct()->pluck('receiver_id');
        $receivedFrom = Message::where('receiver_id', $userId)->distinct()->pluck('sender_id');

        $partnerIds = $sentTo->merge($receivedFrom)->unique()->values();

        $partners = User::whereIn('id', $partnerIds)
            ->select('id', 'name', 'email', 'client_type')
            ->get()
            ->map(function ($partner) use ($userId) {
                $lastMessage = Message::where(function ($q) use ($userId, $partner) {
                    $q->where('sender_id', $userId)->where('receiver_id', $partner->id);
                })->orWhere(function ($q) use ($userId, $partner) {
                    $q->where('sender_id', $partner->id)->where('receiver_id', $userId);
                })->orderByDesc('created_at')->first();

                $unreadCount = Message::where('sender_id', $partner->id)
                    ->where('receiver_id', $userId)
                    ->where('is_read', false)
                    ->count();

                return array_merge($partner->toArray(), [
                    'last_message'  => $lastMessage,
                    'unread_count'  => $unreadCount,
                ]);
            });

        return response()->json(['data' => $partners]);
    }

    /**
     * GET /api/client/messages/{userId}
     * Get full conversation thread with a specific user
     */
    public function thread(Request $request, string $partnerId): JsonResponse
    {
        $userId = $request->user()->id;

        $messages = Message::with(['sender:id,name,client_type', 'receiver:id,name,client_type'])
            ->where(function ($q) use ($userId, $partnerId) {
                $q->where('sender_id', $userId)->where('receiver_id', $partnerId);
            })->orWhere(function ($q) use ($userId, $partnerId) {
                $q->where('sender_id', $partnerId)->where('receiver_id', $userId);
            })
            ->orderBy('created_at')
            ->paginate(50);

        // Mark received messages as read
        Message::where('sender_id', $partnerId)
            ->where('receiver_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => Carbon::now()]);

        return response()->json($messages);
    }

    /**
     * POST /api/client/messages
     * Send a message to another user
     */
    public function send(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'receiver_id'  => 'required|uuid|exists:users,id',
            'content'      => 'required|string|max:5000',
            'job_offer_id' => 'nullable|uuid|exists:job_offers,id',
        ]);

        // Cannot message yourself
        if ($validated['receiver_id'] === $user->id) {
            return response()->json(['message' => 'Cannot send a message to yourself.'], 422);
        }

        $message = Message::create([
            'sender_id'    => $user->id,
            'receiver_id'  => $validated['receiver_id'],
            'content'      => $validated['content'],
            'job_offer_id' => $validated['job_offer_id'] ?? null,
            'is_read'      => false,
        ]);

        $message->load(['sender:id,name,client_type', 'receiver:id,name,client_type', 'jobOffer:id,title']);

        return response()->json(['data' => $message], 201);
    }

    /**
     * GET /api/client/messages/unread-count
     * Quick count of unread messages for the current user
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = Message::where('receiver_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }
}
