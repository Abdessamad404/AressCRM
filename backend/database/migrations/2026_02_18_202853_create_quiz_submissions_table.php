<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete(); // commercial who submitted

            $table->json('answers')->nullable();          // { question_id: answer }
            $table->text('essay_answer')->nullable();
            $table->unsignedInteger('score')->nullable(); // calculated score
            $table->unsignedInteger('max_score')->nullable();
            $table->enum('status', ['in_progress', 'submitted', 'reviewed'])->default('in_progress');
            $table->text('reviewer_notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_submissions');
    }
};
