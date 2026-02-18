<?php

namespace App\Http\Controllers;

use App\Models\Bug;
use App\Models\Lead;
use App\Models\LeadHistory;
use App\Models\BugHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $isAdmin = $request->user()->role === 'admin';
        $userId  = $request->user()->id;

        $leadQuery = $isAdmin ? Lead::query() : Lead::where('assigned_to_id', $userId);
        $bugQuery  = $isAdmin ? Bug::query()  : Bug::where(fn($q) => $q->where('assigned_to_id', $userId)->orWhere('reported_by_id', $userId));

        $totalLeads    = (clone $leadQuery)->count();
        $leadsByStatus = (clone $leadQuery)->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status');
        $wonLeads      = $leadsByStatus['Won'] ?? 0;
        $conversionRate = $totalLeads > 0 ? round(($wonLeads / $totalLeads) * 100, 1) : 0;

        $totalBugs    = (clone $bugQuery)->count();
        $bugsByStatus = (clone $bugQuery)->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status');

        // Recent activity: last 10 lead + bug history entries
        $leadActivity = LeadHistory::with(['user', 'lead'])
            ->latest('created_at')->limit(5)->get()
            ->map(fn($h) => [
                'id'         => $h->id,
                'type'       => 'lead',
                'action'     => $h->action,
                'subject'    => $h->lead?->name ?? 'Deleted Lead',
                'user'       => $h->user?->name ?? 'System',
                'created_at' => $h->created_at,
            ]);

        $bugActivity = BugHistory::with(['user', 'bug'])
            ->latest('created_at')->limit(5)->get()
            ->map(fn($h) => [
                'id'         => $h->id,
                'type'       => 'bug',
                'action'     => $h->action,
                'subject'    => $h->bug?->title ?? 'Deleted Bug',
                'user'       => $h->user?->name ?? 'System',
                'created_at' => $h->created_at,
            ]);

        $recentActivity = $leadActivity->concat($bugActivity)
            ->sortByDesc('created_at')
            ->values()
            ->take(10);

        return response()->json(['data' => [
            'total_leads'     => $totalLeads,
            'leads_by_status' => $leadsByStatus,
            'conversion_rate' => $conversionRate,
            'total_bugs'      => $totalBugs,
            'bugs_by_status'  => $bugsByStatus,
            'recent_activity' => $recentActivity,
        ]]);
    }
}
