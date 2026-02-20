<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuizAssignment extends Model
{
    public $incrementing = false;
    public $timestamps   = false;   // only has assigned_at, not created_at/updated_at
    protected $keyType   = 'string';

    protected $fillable = [
        'quiz_id',
        'application_id',
        'assigned_by_id',
        'assigned_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
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

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by_id');
    }
}
