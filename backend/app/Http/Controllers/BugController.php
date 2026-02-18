<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBugRequest;
use App\Http\Requests\UpdateBugRequest;
use App\Http\Resources\BugResource;
use App\Models\Bug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BugController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Bug::with(['assignedTo', 'reportedBy', 'relatedLead']);

        if ($request->user()->role !== 'admin') {
            $query->where(fn($q) => $q
                ->where('assigned_to_id', $request->user()->id)
                ->orWhere('reported_by_id', $request->user()->id)
            );
        }

        if ($search = $request->query('search')) {
            $query->where(fn($q) => $q
                ->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
            );
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }
        if ($assignedTo = $request->query('assigned_to_id')) {
            $query->where('assigned_to_id', $assignedTo);
        }

        $bugs = $query->latest()->paginate($request->query('per_page', 15));

        return response()->json(BugResource::collection($bugs)->response()->getData(true));
    }

    public function store(StoreBugRequest $request): JsonResponse
    {
        $bug = Bug::create(array_merge(
            $request->validated(),
            ['reported_by_id' => $request->user()->id]
        ));

        return response()->json(['data' => new BugResource($bug->load(['assignedTo', 'reportedBy']))], 201);
    }

    public function show(Bug $bug): JsonResponse
    {
        return response()->json(['data' => new BugResource(
            $bug->load(['assignedTo', 'reportedBy', 'relatedLead', 'history.user'])
        )]);
    }

    public function update(UpdateBugRequest $request, Bug $bug): JsonResponse
    {
        $bug->update($request->validated());

        return response()->json(['data' => new BugResource($bug->load(['assignedTo', 'reportedBy']))]);
    }

    public function destroy(Bug $bug): JsonResponse
    {
        $bug->delete();
        return response()->json(['message' => 'Bug deleted.']);
    }
}
