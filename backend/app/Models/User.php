<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'theme_preference',
        'client_type',
        'phone',
        'company',
        'source',
        'lead_status',
        'notes',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id = (string) Str::uuid());
    }

    public function createdLeads()
    {
        return $this->hasMany(Lead::class, 'created_by_id');
    }

    public function assignedLeads()
    {
        return $this->hasMany(Lead::class, 'assigned_to_id');
    }

    public function assignedBugs()
    {
        return $this->hasMany(Bug::class, 'assigned_to_id');
    }

    public function reportedBugs()
    {
        return $this->hasMany(Bug::class, 'reported_by_id');
    }

    // Client relations
    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function jobOffers()
    {
        return $this->hasMany(JobOffer::class);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class, 'created_by_id');
    }

    public function quizSubmissions()
    {
        return $this->hasMany(QuizSubmission::class);
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function isCommercial(): bool
    {
        return $this->client_type === 'commercial';
    }

    public function isEntreprise(): bool
    {
        return $this->client_type === 'entreprise';
    }
}
