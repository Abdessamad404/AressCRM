<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LeadController extends Controller
{
    /**
     * Leads = registered users with client_type commercial or entreprise.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::whereIn('client_type', ['commercial', 'entreprise']);

        // Search by name, email, or company
        if ($search = $request->query('search')) {
            $query->where(fn($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('company', 'like', "%{$search}%")
            );
        }

        // Filter by lead_status (frontend sends ?status=...)
        if ($status = $request->query('status')) {
            $query->where('lead_status', $status);
        }

        // Filter by source
        if ($source = $request->query('source')) {
            $query->where('source', $source);
        }

        // Filter by client_type
        if ($clientType = $request->query('client_type')) {
            $query->where('client_type', $clientType);
        }

        // Sorting
        $allowed = ['name', 'company', 'lead_status', 'source', 'created_at'];
        $sortBy  = in_array($request->query('sort_by'), $allowed) ? $request->query('sort_by') : 'created_at';
        $sortDir = $request->query('sort_dir') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $leads = $query->paginate($request->query('per_page', 15));

        return response()->json(LeadResource::collection($leads)->response()->getData(true));
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name'        => $data['name'],
            'email'       => $data['email'],
            'password'    => Str::random(16), // random — they set their own via registration
            'role'        => 'user',
            'client_type' => $data['client_type'],
            'phone'       => $data['phone'] ?? null,
            'company'     => $data['company'] ?? null,
            'source'      => $data['source'] ?? null,
            'lead_status' => $data['lead_status'] ?? 'New',
            'notes'       => $data['notes'] ?? null,
        ]);

        return response()->json(['data' => new LeadResource($user)], 201);
    }

    public function show(User $lead): JsonResponse
    {
        return response()->json(['data' => new LeadResource($lead)]);
    }

    public function update(UpdateLeadRequest $request, User $lead): JsonResponse
    {
        $data = $request->validated();

        // Map 'status' from frontend → 'lead_status' column
        if (isset($data['status'])) {
            $data['lead_status'] = $data['status'];
            unset($data['status']);
        }

        $lead->update($data);

        return response()->json(['data' => new LeadResource($lead->fresh())]);
    }

    public function updateStatus(Request $request, User $lead): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:New,Contacted,Interested,Negotiation,Won,Lost'],
        ]);

        $lead->update(['lead_status' => $request->status]);

        return response()->json(['data' => new LeadResource($lead->fresh())]);
    }

    public function destroy(User $lead): JsonResponse
    {
        $lead->delete();
        return response()->json(['message' => 'Lead deleted.']);
    }
}
