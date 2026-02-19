<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_history', function (Blueprint $table) {
            // Drop the NOT NULL constraint on lead_id so rows can belong to a User instead
            $table->dropForeign(['lead_id']);
            $table->uuid('lead_id')->nullable()->change();
            $table->foreign('lead_id')->references('id')->on('leads')->cascadeOnDelete();

            // New FK: history rows that belong to a client User (the new "lead")
            $table->foreignUuid('client_user_id')
                  ->nullable()
                  ->after('lead_id')
                  ->constrained('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lead_history', function (Blueprint $table) {
            $table->dropForeign(['client_user_id']);
            $table->dropColumn('client_user_id');
            $table->dropForeign(['lead_id']);
            $table->uuid('lead_id')->nullable(false)->change();
            $table->foreign('lead_id')->references('id')->on('leads')->cascadeOnDelete();
        });
    }
};
