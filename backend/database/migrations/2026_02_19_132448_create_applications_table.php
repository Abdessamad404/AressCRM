<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete(); // commercial/candidate

            $table->text('cover_letter')->nullable();
            $table->enum('status', ['pending', 'shortlisted', 'rejected', 'accepted'])->default('pending');
            $table->text('entreprise_notes')->nullable(); // private notes from the entreprise

            $table->timestamps();

            // One application per candidate per job offer
            $table->unique(['job_offer_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
