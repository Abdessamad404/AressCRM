<?php

namespace App\Observers;

use App\Models\Lead;
use App\Models\LeadHistory;
use Illuminate\Support\Facades\Auth;

class LeadObserver
{
    private array $tracked = ['status', 'assigned_to_id', 'name', 'email', 'phone', 'company', 'source', 'notes'];

    public function created(Lead $lead): void
    {
        LeadHistory::create([
            'lead_id'   => $lead->id,
            'user_id'   => Auth::id(),
            'action'    => 'Lead created',
            'old_value' => null,
            'new_value' => $lead->name,
        ]);
    }

    public function updated(Lead $lead): void
    {
        $userId = Auth::id();

        foreach ($this->tracked as $field) {
            if ($lead->wasChanged($field)) {
                LeadHistory::create([
                    'lead_id'   => $lead->id,
                    'user_id'   => $userId,
                    'action'    => "Changed {$field}",
                    'old_value' => (string) $lead->getOriginal($field),
                    'new_value' => (string) $lead->getAttribute($field),
                ]);
            }
        }
    }

    public function deleted(Lead $lead): void
    {
        // History is cascade-deleted by DB, no action needed
    }
}
