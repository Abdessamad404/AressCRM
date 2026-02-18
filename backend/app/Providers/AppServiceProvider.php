<?php

namespace App\Providers;

use App\Models\Bug;
use App\Models\Lead;
use App\Observers\BugObserver;
use App\Observers\LeadObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Lead::observe(LeadObserver::class);
        Bug::observe(BugObserver::class);
    }
}
