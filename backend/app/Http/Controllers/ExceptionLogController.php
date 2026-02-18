<?php

namespace App\Http\Controllers;

use App\Models\Bug;
use App\Http\Resources\BugResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ExceptionLogController extends Controller
{
    /**
     * Report a frontend JS exception (called from React error boundary).
     */
    public function report(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'           => ['required', 'string', 'max:500'],
            'description'     => ['sometimes', 'string'],
            'exception_class' => ['sometimes', 'string', 'max:255'],
            'stack_trace'     => ['sometimes', 'string'],
            'url'             => ['sometimes', 'string', 'max:2000'],
            'http_method'     => ['sometimes', 'string', 'max:10'],
            'user_agent'      => ['sometimes', 'string'],
            'environment'     => ['sometimes', 'string', 'max:20'],
        ]);

        // Deduplicate by fingerprint (exception class + first stack line)
        $fingerprint = md5(($data['exception_class'] ?? '') . substr($data['stack_trace'] ?? '', 0, 200));

        $existing = Bug::where('fingerprint', $fingerprint)
            ->whereNotIn('status', ['resolved', 'closed'])
            ->first();

        if ($existing) {
            $existing->increment('occurrence_count');
            $existing->update(['last_occurred_at' => now()]);
            return response()->json(['data' => new BugResource($existing), 'deduplicated' => true]);
        }

        $bug = Bug::create(array_merge($data, [
            'status'           => 'open',
            'priority'         => $this->detectPriority($data),
            'reported_by_id'   => $request->user()?->id ?? Bug::first()?->reported_by_id, // fallback
            'environment'      => $data['environment'] ?? app()->environment(),
            'user_agent'       => $data['user_agent'] ?? $request->userAgent(),
            'url'              => $data['url'] ?? $request->header('Referer'),
            'last_occurred_at' => now(),
            'fingerprint'      => $fingerprint,
        ]));

        return response()->json(['data' => new BugResource($bug)], 201);
    }

    /**
     * Auto-detect priority from exception type.
     */
    private function detectPriority(array $data): string
    {
        $class = strtolower($data['exception_class'] ?? '');
        if (str_contains($class, 'fatal') || str_contains($class, 'uncaught')) return 'critical';
        if (str_contains($class, 'error') || str_contains($class, 'exception')) return 'high';
        if (str_contains($class, 'warning')) return 'medium';
        return 'low';
    }

    /**
     * Mark a bug as resolved.
     */
    public function resolve(Bug $bug): JsonResponse
    {
        $bug->update(['status' => 'resolved']);
        return response()->json(['data' => new BugResource($bug)]);
    }

    /**
     * Manually log a backend exception (called from Laravel's exception handler).
     */
    public static function logException(\Throwable $e, ?Request $request = null): void
    {
        try {
            $fingerprint = md5(get_class($e) . substr($e->getMessage(), 0, 100));
            $existing = Bug::where('fingerprint', $fingerprint)
                ->whereNotIn('status', ['resolved', 'closed'])
                ->first();

            if ($existing) {
                $existing->increment('occurrence_count');
                $existing->update(['last_occurred_at' => now()]);
                return;
            }

            // Get first non-vendor stack frame
            $frames = collect($e->getTrace())->filter(fn($f) => isset($f['file']) && !str_contains($f['file'], 'vendor'))->values();
            $firstFrame = $frames->first();
            $location = $firstFrame ? basename($firstFrame['file']) . ':' . ($firstFrame['line'] ?? '?') : 'unknown';

            // Find an admin user to assign the bug to
            $adminId = \App\Models\User::where('role', 'admin')->value('id');

            Bug::create([
                'title'            => Str::limit(get_class($e) . ': ' . $e->getMessage(), 255),
                'description'      => $e->getMessage(),
                'exception_class'  => get_class($e),
                'stack_trace'      => $e->getTraceAsString(),
                'url'              => $request?->fullUrl(),
                'http_method'      => $request?->method(),
                'user_agent'       => $request?->userAgent(),
                'environment'      => app()->environment(),
                'status'           => 'open',
                'priority'         => 'high',
                'reported_by_id'   => $adminId,
                'last_occurred_at' => now(),
                'fingerprint'      => $fingerprint,
            ]);
        } catch (\Throwable) {
            // Silently fail — never let error logging crash the app
        }
    }
}
