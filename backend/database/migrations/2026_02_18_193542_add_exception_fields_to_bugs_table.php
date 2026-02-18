<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bugs', function (Blueprint $table) {
            $table->string('exception_class')->nullable()->after('description');
            $table->text('stack_trace')->nullable()->after('exception_class');
            $table->string('url')->nullable()->after('stack_trace');
            $table->string('http_method', 10)->nullable()->after('url');
            $table->text('user_agent')->nullable()->after('http_method');
            $table->string('environment', 20)->nullable()->default('production')->after('user_agent');
            $table->unsignedInteger('occurrence_count')->default(1)->after('environment');
            $table->timestamp('last_occurred_at')->nullable()->after('occurrence_count');
            $table->string('fingerprint')->nullable()->after('last_occurred_at');
        });
    }

    public function down(): void
    {
        Schema::table('bugs', function (Blueprint $table) {
            $table->dropColumn([
                'exception_class', 'stack_trace', 'url', 'http_method',
                'user_agent', 'environment', 'occurrence_count',
                'last_occurred_at', 'fingerprint',
            ]);
        });
    }
};
