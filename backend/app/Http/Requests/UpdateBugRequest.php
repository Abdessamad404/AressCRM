<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBugRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title'           => ['sometimes', 'required', 'string', 'max:255'],
            'description'     => ['sometimes', 'required', 'string'],
            'status'          => ['nullable', 'in:open,in_progress,resolved,closed'],
            'priority'        => ['nullable', 'in:low,medium,high,critical'],
            'assigned_to_id'  => ['nullable', 'uuid', 'exists:users,id'],
            'related_lead_id' => ['nullable', 'uuid', 'exists:leads,id'],
        ];
    }
}
