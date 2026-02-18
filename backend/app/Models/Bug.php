<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Bug extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'title', 'description', 'status', 'priority',
        'assigned_to_id', 'reported_by_id', 'related_lead_id',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id = (string) Str::uuid());
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to_id');
    }

    public function reportedBy()
    {
        return $this->belongsTo(User::class, 'reported_by_id');
    }

    public function relatedLead()
    {
        return $this->belongsTo(Lead::class, 'related_lead_id');
    }

    public function history()
    {
        return $this->hasMany(BugHistory::class)->latest('created_at');
    }
}
