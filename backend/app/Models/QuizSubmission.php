<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuizSubmission extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'quiz_id',
        'user_id',
        'answers',
        'essay_answer',
        'score',
        'max_score',
        'status',
        'reviewer_notes',
        'submitted_at',
    ];

    protected $casts = [
        'answers'      => 'array',
        'score'        => 'integer',
        'max_score'    => 'integer',
        'submitted_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id = (string) Str::uuid());
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
