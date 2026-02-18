<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Quiz extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'created_by_id',
        'job_offer_id',
        'title',
        'description',
        'essay_prompt',
        'time_limit_minutes',
        'is_published',
    ];

    protected $casts = [
        'is_published'       => 'boolean',
        'time_limit_minutes' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id = (string) Str::uuid());
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function jobOffer()
    {
        return $this->belongsTo(JobOffer::class);
    }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('order');
    }

    public function submissions()
    {
        return $this->hasMany(QuizSubmission::class);
    }
}
