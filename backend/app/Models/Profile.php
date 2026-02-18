<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Profile extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'title',
        'bio',
        'skills',
        'expertise',
        'location',
        'availability',
        'experience_years',
        'commission_rate',
        'linkedin_url',
        'avatar_url',
        'achievements',
        'sectors',
        'is_published',
    ];

    protected $casts = [
        'skills'       => 'array',
        'expertise'    => 'array',
        'achievements' => 'array',
        'sectors'      => 'array',
        'is_published' => 'boolean',
        'commission_rate' => 'decimal:2',
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
}
