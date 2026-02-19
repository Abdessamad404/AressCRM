<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class JobOffer extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'company_name',
        'location',
        'sector',
        'mission_type',
        'compensation_type',
        'commission_rate',
        'budget_amount',
        'contract_duration',
        'requirements',
        'benefits',
        'status',
        'views_count',
        'product_sheet_path',
        'product_sheet_name',
    ];

    protected $casts = [
        'requirements'    => 'array',
        'benefits'        => 'array',
        'commission_rate' => 'decimal:2',
        'budget_amount'   => 'decimal:2',
        'views_count'     => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id = (string) Str::uuid());
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }
}
