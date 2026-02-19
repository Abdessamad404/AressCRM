<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['required', 'email', 'unique:users,email'],
            'phone'       => ['nullable', 'string', 'max:50'],
            'company'     => ['nullable', 'string', 'max:255'],
            'source'      => ['nullable', 'in:LinkedIn,Referral,Cold call,Website,Other'],
            'lead_status' => ['nullable', 'in:New,Contacted,Interested,Negotiation,Won,Lost'],
            'notes'       => ['nullable', 'string'],
            'client_type' => ['required', 'in:commercial,entreprise'],
        ];
    }
}
