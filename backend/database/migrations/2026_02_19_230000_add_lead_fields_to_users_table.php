<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('company')->nullable()->after('phone');
            $table->string('source')->nullable()->after('company'); // LinkedIn, Referral, Cold call, Website, Other
            $table->string('lead_status')->default('New')->after('source'); // New, Contacted, Interested, Negotiation, Won, Lost
            $table->text('notes')->nullable()->after('lead_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'company', 'source', 'lead_status', 'notes']);
        });
    }
};
