<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BugResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'title'             => $this->title,
            'description'       => $this->description,
            'status'            => $this->status,
            'priority'          => $this->priority,
            'exception_class'   => $this->exception_class,
            'stack_trace'       => $this->stack_trace,
            'url'               => $this->url,
            'http_method'       => $this->http_method,
            'user_agent'        => $this->user_agent,
            'environment'       => $this->environment,
            'occurrence_count'  => $this->occurrence_count,
            'last_occurred_at'  => $this->last_occurred_at,
            'fingerprint'       => $this->fingerprint,
            'assigned_to'       => $this->whenLoaded('assignedTo', fn() => new UserResource($this->assignedTo)),
            'reported_by'       => $this->whenLoaded('reportedBy', fn() => new UserResource($this->reportedBy)),
            'related_lead'      => $this->whenLoaded('relatedLead', fn() => new LeadResource($this->relatedLead)),
            'history'           => $this->whenLoaded('history', fn() => HistoryResource::collection($this->history)),
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,
        ];
    }
}
