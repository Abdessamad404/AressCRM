<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_offers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete(); // entreprise user

            $table->string('title');
            $table->text('description');
            $table->string('company_name');
            $table->string('location')->nullable();
            $table->string('sector')->nullable();
            $table->string('mission_type')->nullable();  // "direct_sales" | "lead_gen" | "demo" | "other"
            $table->decimal('commission_rate', 5, 2)->nullable();
            $table->string('contract_duration')->nullable(); // "1month" | "3months" | "ongoing"
            $table->json('requirements')->nullable();     // ["2+ years experience", "B2B knowledge"]
            $table->json('benefits')->nullable();
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->unsignedInteger('views_count')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_offers');
    }
};
