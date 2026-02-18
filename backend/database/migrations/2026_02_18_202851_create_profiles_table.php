<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();

            // Commercial profile fields
            $table->string('title')->nullable();            // e.g. "Sales Expert B2B"
            $table->text('bio')->nullable();
            $table->json('skills')->nullable();             // ["Prospecting", "CRM", "Closing"]
            $table->json('expertise')->nullable();          // domains of expertise
            $table->string('location')->nullable();
            $table->string('availability')->nullable();     // "immediate" | "1month" | "3months"
            $table->unsignedInteger('experience_years')->nullable();
            $table->decimal('commission_rate', 5, 2)->nullable(); // expected commission %
            $table->string('linkedin_url')->nullable();
            $table->string('avatar_url')->nullable();
            $table->json('achievements')->nullable();       // list of past achievements
            $table->json('sectors')->nullable();            // preferred business sectors

            // Visibility
            $table->boolean('is_published')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
