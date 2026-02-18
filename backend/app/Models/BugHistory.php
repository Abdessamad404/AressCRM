<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class BugHistory extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $table = 'bug_history';

    protected $fillable = [
        'bug_id', 'user_id', 'action', 'old_value', 'new_value',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id = (string) Str::uuid());
    }

    public function bug()
    {
        return $this->belongsTo(Bug::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
