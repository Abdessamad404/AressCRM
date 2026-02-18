<?php

namespace App\Observers;

use App\Models\Bug;
use App\Models\BugHistory;
use Illuminate\Support\Facades\Auth;

class BugObserver
{
    private array $tracked = ['status', 'priority', 'assigned_to_id', 'title', 'description'];

    public function created(Bug $bug): void
    {
        BugHistory::create([
            'bug_id'    => $bug->id,
            'user_id'   => Auth::id(),
            'action'    => 'Bug reported',
            'old_value' => null,
            'new_value' => $bug->title,
        ]);
    }

    public function updated(Bug $bug): void
    {
        $userId = Auth::id();

        foreach ($this->tracked as $field) {
            if ($bug->wasChanged($field)) {
                BugHistory::create([
                    'bug_id'    => $bug->id,
                    'user_id'   => $userId,
                    'action'    => "Changed {$field}",
                    'old_value' => (string) $bug->getOriginal($field),
                    'new_value' => (string) $bug->getAttribute($field),
                ]);
            }
        }
    }
}
