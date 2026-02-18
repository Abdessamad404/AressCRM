<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Extend role to support client types
            // SQLite doesn't support modifying enums, so we add a separate column
            $table->string('client_type')->nullable()->after('role'); // 'commercial' | 'entreprise' | null (internal users keep null)
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('client_type');
        });
    }
};
