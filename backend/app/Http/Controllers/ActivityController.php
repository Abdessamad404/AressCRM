<?php

namespace App\Http\Controllers;

use App\Models\LeadHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $isAdmin = $request->user()->role === 'admin';
        $userId  = $request->user()->id;

        $query = LeadHistory::with(['user', 'lead'])
            ->when(!$isAdmin, fn($q) => $q->where('user_id', $userId));

        // Filter by user (admin only)
        if ($isAdmin && $request->query('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        // Filter by action type
        if ($action = $request->query('action')) {
            $query->where('action', 'like', "%{$action}%");
        }

        // Filter by date range
        if ($from = $request->query('from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $paginator = $query->latest('created_at')
            ->paginate($request->query('per_page', 20));

        $items = $paginator->getCollection()->map(fn($h) => [
            'id'         => $h->id,
            'action'     => $h->action,
            'old_value'  => $h->old_value,
            'new_value'  => $h->new_value,
            'lead_id'    => $h->lead_id,
            'lead_name'  => $h->lead?->name ?? 'Deleted Lead',
            'user_id'    => $h->user_id,
            'user_name'  => $h->user?->name ?? 'System',
            'created_at' => $h->created_at,
        ]);

        return response()->json([
            'data'         => $items->values(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'per_page'     => $paginator->perPage(),
            'total'        => $paginator->total(),
        ]);
    }
}
