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
            'status'      => $this->status,
            'notes'       => $this->notes,
            'created_by'  => $this->whenLoaded('createdBy', fn() => new UserResource($this->createdBy)),
            'history'     => $this->whenLoaded('history', fn() => HistoryResource::collection($this->history)),
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
