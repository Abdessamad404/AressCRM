<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\BugController;
use App\Http\Controllers\ExceptionLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\JobOfferController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\MessageController;

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

    // Frontend error reporting
    Route::post('/exceptions/report', [ExceptionLogController::class, 'report']);

    // Users (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
    });

    // Theme preference (any user)
    Route::patch('/users/{user}/theme', [UserController::class, 'updateTheme']);

    // ─── Client routes (commercial + entreprise) ──────────────────────────────
    Route::prefix('client')->group(function () {

        // Commercial profile (own)
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::post('/profile', [ProfileController::class, 'upsert']);

        // Browse commercial profiles (entreprise talent search)
        Route::get('/profiles', [ProfileController::class, 'index']);
        Route::get('/profiles/{profile}', [ProfileController::class, 'showPublic']);

        // Job offers
        Route::get('/job-offers', [JobOfferController::class, 'index']);
        Route::post('/job-offers', [JobOfferController::class, 'store']);
        Route::get('/job-offers/{jobOffer}', [JobOfferController::class, 'show']);
        Route::put('/job-offers/{jobOffer}', [JobOfferController::class, 'update']);
        Route::delete('/job-offers/{jobOffer}', [JobOfferController::class, 'destroy']);

        // Quizzes
        Route::get('/quizzes', [QuizController::class, 'index']);
        Route::post('/quizzes', [QuizController::class, 'store']);
        Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
        Route::put('/quizzes/{quiz}', [QuizController::class, 'update']);
        Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy']);

        // Quiz questions
        Route::post('/quizzes/{quiz}/questions', [QuizController::class, 'addQuestion']);
        Route::put('/quizzes/{quiz}/questions/{question}', [QuizController::class, 'updateQuestion']);
        Route::delete('/quizzes/{quiz}/questions/{question}', [QuizController::class, 'deleteQuestion']);

        // Quiz submissions
        Route::post('/quizzes/{quiz}/submit', [QuizController::class, 'submit']);
        Route::get('/quizzes/{quiz}/submissions', [QuizController::class, 'submissions']);
        Route::patch('/quizzes/{quiz}/submissions/{submission}/review', [QuizController::class, 'reviewSubmission']);
        Route::get('/my-submissions', [QuizController::class, 'mySubmissions']);

        // Messaging / Chat
        Route::get('/conversations', [MessageController::class, 'conversations']);
        Route::get('/messages/unread-count', [MessageController::class, 'unreadCount']);
        Route::get('/messages/{partnerId}', [MessageController::class, 'thread']);
        Route::post('/messages', [MessageController::class, 'send']);
    });
});
