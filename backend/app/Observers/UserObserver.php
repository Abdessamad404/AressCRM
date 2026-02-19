<?php

namespace App\Observers;

use App\Models\LeadHistory;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UserObserver
{
    // Lead-specific fields to track when a client user (lead) is updated
    private array $tracked = [
        'lead_status' => 'Status updated',
        'name'        => 'Name updated',
        'email'       => 'Email updated',
        'phone'       => 'Phone updated',
        'company'     => 'Company updated',
        'source'      => 'Source updated',
        'notes'       => 'Notes updated',
    ];

    public function created(User $user): void
    {
        // Only track client users (commercial/entreprise) as leads
        if (!in_array($user->client_type, ['commercial', 'entreprise'])) {
            return;
        }

        LeadHistory::create([
            'client_user_id' => $user->id,
            'user_id'        => Auth::id(),
            'action'         => 'Lead created',
            'old_value'      => null,
            'new_value'      => $user->name,
        ]);
    }

    public function updated(User $user): void
    {
        // Only track client users (commercial/entreprise) as leads
        if (!in_array($user->client_type, ['commercial', 'entreprise'])) {
            return;
        }

        $actorId = Auth::id();

        foreach ($this->tracked as $field => $label) {
            if ($user->wasChanged($field)) {
                LeadHistory::create([
                    'client_user_id' => $user->id,
                    'user_id'        => $actorId,
                    'action'         => $label,
                    'old_value'      => $user->getOriginal($field) !== null ? (string) $user->getOriginal($field) : null,
                    'new_value'      => $user->getAttribute($field) !== null ? (string) $user->getAttribute($field) : null,
                ]);
            }
        }
    }
}
