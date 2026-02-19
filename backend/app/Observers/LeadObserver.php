<?php

namespace App\Observers;

use App\Models\Lead;
use App\Models\LeadHistory;
use Illuminate\Support\Facades\Auth;

class LeadObserver
{
    // Fields to track on update, mapped to readable labels
    private array $tracked = [
        'status'  => 'Status updated',
        'name'    => 'Name updated',
        'email'   => 'Email updated',
        'phone'   => 'Phone updated',
        'company' => 'Company updated',
        'source'  => 'Source updated',
        'notes'   => 'Notes updated',
    ];

    public function created(Lead $lead): void
    {
        // Prefer authenticated user; fall back to created_by_id for seeder context
        $userId = Auth::id() ?? $lead->created_by_id;

        LeadHistory::create([
            'lead_id'   => $lead->id,
            'user_id'   => $userId,
            'action'    => 'Lead created',
            'old_value' => null,
            'new_value' => $lead->name,
        ]);
    }

    public function updated(Lead $lead): void
    {
        $userId = Auth::id() ?? $lead->created_by_id;

        foreach ($this->tracked as $field => $label) {
            if ($lead->wasChanged($field)) {
                LeadHistory::create([
                    'lead_id'   => $lead->id,
                    'user_id'   => $userId,
                    'action'    => $label,
                    'old_value' => $lead->getOriginal($field) !== null ? (string) $lead->getOriginal($field) : null,
                    'new_value' => $lead->getAttribute($field) !== null ? (string) $lead->getAttribute($field) : null,
                ]);
            }
        }
    }

    public function deleted(Lead $lead): void
    {
        // History is cascade-deleted by DB, no action needed
    }
}
