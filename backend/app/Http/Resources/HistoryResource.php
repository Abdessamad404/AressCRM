<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'action'     => $this->action,
            'old_value'  => $this->old_value,
            'new_value'  => $this->new_value,
            'user'       => $this->whenLoaded('user', fn() => new UserResource($this->user)),
            'created_at' => $this->created_at,
        ];
    }
}
