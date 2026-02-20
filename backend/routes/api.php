<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\BugController;
use App\Http\Controllers\ExceptionLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\JobOfferController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\QuizAssignmentController;
use App\Http\Controllers\DevSeedController;

// Health check (Render uses this to know the container is ready)
Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Dev seed — no auth required, same pattern as /health (wipes content, reseeds demo data)
Route::get('/dev/seed', [DevSeedController::class, 'seed']);

// Auth routes (guest)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Activity log
    Route::get('/activity', [ActivityController::class, 'index']);

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

    // Frontend error reporting (throttled — max 30 reports/min per user to prevent log flooding)
    Route::post('/exceptions/report', [ExceptionLogController::class, 'report'])->middleware('throttle:30,1');

    // Users (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::get('/users/{user}/progress', [UserController::class, 'progress']);

        // Dev/demo seed — wipes content and recreates realistic demo data (admin only)
        Route::post('/dev/seed', [DevSeedController::class, 'seed']);
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

        // Job offer notification counts (must be before /{jobOffer} parameterized routes)
        Route::get('/job-offers/new-count', [JobOfferController::class, 'newCount']);
        Route::get('/job-offers/pending-applications-count', [JobOfferController::class, 'pendingApplicationsCount']);

        // Job offers
        Route::get('/job-offers', [JobOfferController::class, 'index']);
        Route::post('/job-offers', [JobOfferController::class, 'store']);
        Route::get('/job-offers/{jobOffer}', [JobOfferController::class, 'show']);
        Route::put('/job-offers/{jobOffer}', [JobOfferController::class, 'update']);
        Route::post('/job-offers/{jobOffer}', [JobOfferController::class, 'update']); // multipart _method override
        Route::delete('/job-offers/{jobOffer}', [JobOfferController::class, 'destroy']);

        // Applications
        Route::post('/job-offers/{jobOffer}/apply', [ApplicationController::class, 'apply']);
        Route::get('/job-offers/{jobOffer}/applications', [ApplicationController::class, 'index']);
        Route::patch('/job-offers/{jobOffer}/applications/{application}', [ApplicationController::class, 'update']);
        Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
        Route::get('/my-applications/action-count', [ApplicationController::class, 'actionCount']);

        // Quiz assignments (entreprise assigns quizzes to specific applicants)
        Route::get('/applications/{application}/quiz-assignments', [QuizAssignmentController::class, 'listForApplication']);
        Route::post('/applications/{application}/quiz-assignments', [QuizAssignmentController::class, 'assign']);
        Route::delete('/applications/{application}/quiz-assignments/{assignment}', [QuizAssignmentController::class, 'unassign']);

        // Quiz notification counts (must be before /{quiz} parameterized routes)
        Route::get('/quizzes/unstarted-count', [QuizController::class, 'unstartedCount']);
        Route::get('/quizzes/unreviewed-count', [QuizController::class, 'unreviewedCount']);

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
