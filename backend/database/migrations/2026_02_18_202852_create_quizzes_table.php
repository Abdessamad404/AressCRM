<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('created_by_id')->constrained('users')->cascadeOnDelete(); // entreprise only
            $table->foreignUuid('job_offer_id')->nullable()->constrained('job_offers')->nullOnDelete();

            $table->string('title');
            $table->text('description')->nullable();
            $table->text('essay_prompt')->nullable();     // final open-ended essay question
            $table->unsignedInteger('time_limit_minutes')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
