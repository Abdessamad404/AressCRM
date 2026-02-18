<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\BugController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;

// Auth routes (guest)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Leads
    Route::get('/leads', [LeadController::class, 'index']);
    Route::post('/leads', [LeadController::class, 'store']);
    Route::get('/leads/{lead}', [LeadController::class, 'show']);
    Route::put('/leads/{lead}', [LeadController::class, 'update']);
    Route::patch('/leads/{lead}/status', [LeadController::class, 'updateStatus']);
    Route::delete('/leads/{lead}', [LeadController::class, 'destroy']);

    // Bugs / Exception Monitoring
    Route::get('/bugs', [BugController::class, 'index']);
    Route::post('/bugs', [BugController::class, 'store']);
    Route::get('/bugs/{bug}', [BugController::class, 'show']);
    Route::put('/bugs/{bug}', [BugController::class, 'update']);
    Route::patch('/bugs/{bug}/resolve', [ExceptionLogController::class, 'resolve']);
    Route::delete('/bugs/{bug}', [BugController::class, 'destroy']);

    // Frontend error reporting (requires auth to prevent spam)
    Route::post('/exceptions/report', [ExceptionLogController::class, 'report']);

    // Users (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
    });

    // Theme preference (any user)
    Route::patch('/users/{user}/theme', [UserController::class, 'updateTheme']);
});
