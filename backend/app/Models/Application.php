<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Application extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'job_offer_id',
        'user_id',
        'cover_letter',
        'status',
        'entreprise_notes',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id = (string) Str::uuid());
    }

    public function jobOffer()
    {
        return $this->belongsTo(JobOffer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
