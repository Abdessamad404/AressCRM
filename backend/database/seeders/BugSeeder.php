<?php

namespace Database\Seeders;

use App\Models\Bug;
use App\Models\BugHistory;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Seeder;

class BugSeeder extends Seeder
{
    public function run(): void
    {
        $users    = User::all();
        $admin    = $users->firstWhere('role', 'admin');
        $agents   = $users->where('role', 'user')->values();
        $leads    = Lead::inRandomOrder()->limit(5)->get();

        $bugsData = [
            ['title' => 'Login form not validating email format',     'priority' => 'high',     'status' => 'open'],
            ['title' => 'Kanban drag-and-drop breaks on mobile',      'priority' => 'medium',   'status' => 'in_progress'],
            ['title' => 'Lead export CSV missing phone column',       'priority' => 'low',      'status' => 'resolved'],
            ['title' => 'Dashboard stats show wrong conversion rate', 'priority' => 'critical', 'status' => 'open'],
            ['title' => 'Session expires too quickly',               'priority' => 'medium',   'status' => 'in_progress'],
            ['title' => 'Dark mode toggle not persisting on refresh', 'priority' => 'low',      'status' => 'open'],
            ['title' => 'Lead search returns wrong results',          'priority' => 'high',     'status' => 'resolved'],
            ['title' => 'Bug history not recording status changes',   'priority' => 'high',     'status' => 'open'],
            ['title' => 'Pagination breaks with filters applied',     'priority' => 'medium',   'status' => 'closed'],
            ['title' => 'Admin cannot delete leads created by users', 'priority' => 'critical', 'status' => 'open'],
        ];

        $historyActions = ['Bug reported', 'Status updated', 'Assigned to developer', 'Fix in progress'];

        foreach ($bugsData as $i => $data) {
            $agent = $agents[$i % $agents->count()];
            $lead  = $leads->get($i % $leads->count());

            $bug = Bug::withoutEvents(function () use ($data, $admin, $agent, $lead, $i) {
                return Bug::create(array_merge($data, [
                    'id'              => (string) \Illuminate\Support\Str::uuid(),
                    'description'     => 'Steps to reproduce: 1. Navigate to the feature. 2. Perform the action. 3. Observe the issue.',
                    'reported_by_id'  => $agent->id,
                    'assigned_to_id'  => $i % 2 === 0 ? $admin->id : $agent->id,
                    'related_lead_id' => $lead?->id,
                ]));
            });

            $count = rand(1, 3);
            for ($j = 0; $j < $count; $j++) {
                BugHistory::create([
                    'bug_id'     => $bug->id,
                    'user_id'    => $agent->id,
                    'action'     => $historyActions[$j % count($historyActions)],
                    'old_value'  => null,
                    'new_value'  => null,
                    'created_at' => now()->subDays(rand(1, 14)),
                ]);
            }
        }
    }
}
