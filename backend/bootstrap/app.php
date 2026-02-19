<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });

        // Auto-log unhandled exceptions to the bugs/error monitoring table
        $exceptions->reportable(function (\Throwable $e) {
            $request = request();
            // Only log API errors, skip auth/validation exceptions (too noisy)
            if (!($e instanceof \Illuminate\Auth\AuthenticationException)
                && !($e instanceof \Illuminate\Validation\ValidationException)
                && !($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException)
                && !($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException)
            ) {
                \App\Http\Controllers\ExceptionLogController::logException($e, $request);
            }
        });
    })->create();
