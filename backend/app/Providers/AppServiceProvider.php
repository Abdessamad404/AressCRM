<?php

namespace App\Providers;

use App\Models\Bug;
use App\Models\User;
use App\Observers\BugObserver;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Bug::observe(BugObserver::class);

        // Bind the {lead} route parameter to the User model
        // (leads are now client users with client_type commercial|entreprise)
        Route::model('lead', User::class);
    }
}
