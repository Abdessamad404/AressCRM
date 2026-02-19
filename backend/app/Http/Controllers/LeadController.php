<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Lead::with(['createdBy']);

        // Search
        if ($search = $request->query('search')) {
            $query->where(fn($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('company', 'like', "%{$search}%")
            );
        }

        // Filters
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($source = $request->query('source')) {
            $query->where('source', $source);
        }

        $leads = $query->latest()->paginate($request->query('per_page', 15));

        return response()->json(LeadResource::collection($leads)->response()->getData(true));
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $lead = Lead::create(array_merge(
            $request->validated(),
            ['created_by_id' => $request->user()->id]
        ));

        return response()->json(['data' => new LeadResource($lead->load(['createdBy']))], 201);
    }

    public function show(Lead $lead): JsonResponse
    {
        return response()->json(['data' => new LeadResource(
            $lead->load(['createdBy', 'history.user'])
        )]);
    }

    public function update(UpdateLeadRequest $request, Lead $lead): JsonResponse
    {
        $lead->update($request->validated());

        return response()->json(['data' => new LeadResource($lead->load(['createdBy']))]);
    }

    public function updateStatus(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:New,Contacted,Interested,Negotiation,Won,Lost'],
        ]);

        $lead->update(['status' => $request->status]);

        return response()->json(['data' => new LeadResource($lead->load(['createdBy']))]);
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();
        return response()->json(['message' => 'Lead deleted.']);
    }
}
