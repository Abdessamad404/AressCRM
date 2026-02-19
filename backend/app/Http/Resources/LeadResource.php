<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'email'       => $this->email,
            'phone'       => $this->phone,
            'company'     => $this->company,
            'source'      => $this->source,
            'status'      => $this->lead_status,  // alias lead_status → status for frontend
            'notes'       => $this->notes,
            'client_type' => $this->client_type,
            'created_by'  => null,
            'history'     => $this->whenLoaded('leadHistory', fn() =>
                $this->leadHistory->map(fn($h) => [
                    'id'        => $h->id,
                    'action'    => $h->action,
                    'old_value' => $h->old_value,
                    'new_value' => $h->new_value,
                    'created_at'=> $h->created_at,
                    'user'      => $h->user ? ['id' => $h->user->id, 'name' => $h->user->name] : null,
                ])
            , []),
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
