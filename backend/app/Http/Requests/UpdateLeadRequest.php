<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'           => ['sometimes', 'required', 'string', 'max:255'],
            'email'          => ['sometimes', 'required', 'email'],
            'phone'          => ['nullable', 'string', 'max:50'],
            'company'        => ['nullable', 'string', 'max:255'],
            'source'         => ['nullable', 'in:LinkedIn,Referral,Cold call,Website,Other'],
            'status'         => ['nullable', 'in:New,Contacted,Interested,Negotiation,Won,Lost'],
            'notes'          => ['nullable', 'string'],
            'assigned_to_id' => ['nullable', 'uuid', 'exists:users,id'],
        ];
    }
}
