<?php

namespace App\Http\Controllers;

use App\Models\Bug;
use App\Models\JobOffer;
use App\Models\Lead;
use App\Models\LeadHistory;
use App\Models\BugHistory;
use App\Models\Message;
use App\Models\QuizSubmission;
use App\Models\User;
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

        $totalLeads     = (clone $leadQuery)->count();
        $leadsByStatus  = (clone $leadQuery)->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status');
        $wonLeads       = $leadsByStatus['Won'] ?? 0;
        $conversionRate = $totalLeads > 0 ? round(($wonLeads / $totalLeads) * 100, 1) : 0;

        $totalBugs    = (clone $bugQuery)->count();
        $bugsByStatus = (clone $bugQuery)->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status');

        // ── Client platform stats (admin-only) ────────────────────────────────
        $clientStats = null;
        if ($isAdmin) {
            $clientStats = [
                'total_commercials' => User::where('client_type', 'commercial')->count(),
                'total_entreprises' => User::where('client_type', 'entreprise')->count(),
                'total_job_offers'  => JobOffer::count(),
                'active_job_offers' => JobOffer::where('status', 'active')->count(),
                'total_submissions' => QuizSubmission::count(),
                'total_messages'    => Message::count(),
            ];
        }

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
            'client_stats'    => $clientStats,
            'recent_activity' => $recentActivity,
        ]]);
    }
}
