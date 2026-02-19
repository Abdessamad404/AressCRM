<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            // Entreprise company fields
            $table->string('company_name')->nullable()->after('bio');
            $table->string('company_website')->nullable()->after('company_name');
            $table->string('company_size')->nullable()->after('company_website');
            $table->string('company_logo_path')->nullable()->after('company_size');
            $table->string('company_logo_name')->nullable()->after('company_logo_path');
            // Avatar stored as uploaded file (shared)
            $table->string('avatar_path')->nullable()->after('avatar_url');
            $table->string('avatar_name')->nullable()->after('avatar_path');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn([
                'company_name', 'company_website', 'company_size',
                'company_logo_path', 'company_logo_name',
                'avatar_path', 'avatar_name',
            ]);
        });
    }
};
