<?php

namespace App\Http\Controllers;

use App\Models\Bug;
use App\Models\BugHistory;
use App\Models\JobOffer;
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

        // Leads = client users (commercial + entreprise)
        $leadQuery = User::whereIn('client_type', ['commercial', 'entreprise']);

        $totalLeads    = (clone $leadQuery)->count();
        $leadsByStatus = (clone $leadQuery)
            ->selectRaw('lead_status as status, count(*) as count')
            ->groupBy('lead_status')
            ->pluck('count', 'status');

        $wonLeads       = $leadsByStatus['Won'] ?? 0;
        $conversionRate = $totalLeads > 0 ? round(($wonLeads / $totalLeads) * 100, 1) : 0;

        // Month-over-month trend for leads
        $thisMonth      = now()->startOfMonth();
        $lastMonth      = now()->subMonth()->startOfMonth();
        $leadsThisMonth = (clone $leadQuery)->where('created_at', '>=', $thisMonth)->count();
        $leadsLastMonth = (clone $leadQuery)->whereBetween('created_at', [$lastMonth, $thisMonth])->count();
        $leadsTrend     = $leadsLastMonth > 0
            ? round((($leadsThisMonth - $leadsLastMonth) / $leadsLastMonth) * 100, 1)
            : null;

        // Bugs
        $bugQuery = $isAdmin
            ? Bug::query()
            : Bug::where(fn($q) => $q->where('assigned_to_id', $userId)->orWhere('reported_by_id', $userId));

        $totalBugs    = (clone $bugQuery)->count();
        $bugsByStatus = (clone $bugQuery)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $bugsThisMonth = (clone $bugQuery)->where('created_at', '>=', $thisMonth)->count();
        $bugsLastMonth = (clone $bugQuery)->whereBetween('created_at', [$lastMonth, $thisMonth])->count();
        $bugsTrend     = $bugsLastMonth > 0
            ? round((($bugsThisMonth - $bugsLastMonth) / $bugsLastMonth) * 100, 1)
            : null;

        // Client platform stats (admin only)
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

        // Recent activity from bug history
        $recentActivity = BugHistory::with(['user', 'bug'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn($h) => [
                'id'         => $h->id,
                'type'       => 'bug',
                'action'     => $h->action,
                'subject'    => $h->bug?->title ?? 'Deleted Bug',
                'user'       => $h->user?->name ?? 'System',
                'created_at' => $h->created_at,
            ])
            ->values();

        return response()->json(['data' => [
            'total_leads'     => $totalLeads,
            'leads_by_status' => $leadsByStatus,
            'conversion_rate' => $conversionRate,
            'leads_trend'     => $leadsTrend,
            'total_bugs'      => $totalBugs,
            'bugs_by_status'  => $bugsByStatus,
            'bugs_trend'      => $bugsTrend,
            'client_stats'    => $clientStats,
            'recent_activity' => $recentActivity,
        ]]);
    }
}
