<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_offers', function (Blueprint $table) {
            // Budget mode: fixed amount OR commission (commission_rate already exists)
            $table->enum('compensation_type', ['commission', 'fixed_budget'])->default('commission')->after('commission_rate');
            $table->decimal('budget_amount', 10, 2)->nullable()->after('compensation_type'); // used when type=fixed_budget

            // Product sheet (file path stored after upload)
            $table->string('product_sheet_path')->nullable()->after('budget_amount');
            $table->string('product_sheet_name')->nullable()->after('product_sheet_path'); // original filename
        });
    }

    public function down(): void
    {
        Schema::table('job_offers', function (Blueprint $table) {
            $table->dropColumn(['compensation_type', 'budget_amount', 'product_sheet_path', 'product_sheet_name']);
        });
    }
};
