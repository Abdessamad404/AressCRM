<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // personal_access_tokens.tokenable_id was created as bigint but User PKs are UUIDs.
        // Truncate tokens (none exist yet in production) and alter column type to varchar.
        DB::statement('TRUNCATE TABLE personal_access_tokens');
        DB::statement('ALTER TABLE personal_access_tokens DROP COLUMN IF EXISTS tokenable_id');
        DB::statement('ALTER TABLE personal_access_tokens DROP COLUMN IF EXISTS tokenable_type');
        DB::statement('ALTER TABLE personal_access_tokens ADD COLUMN tokenable_type varchar(255) NOT NULL DEFAULT \'\'');
        DB::statement('ALTER TABLE personal_access_tokens ADD COLUMN tokenable_id char(36) NOT NULL DEFAULT \'\'');
        DB::statement('CREATE INDEX IF NOT EXISTS personal_access_tokens_tokenable_type_tokenable_id_index ON personal_access_tokens (tokenable_type, tokenable_id)');
    }

    public function down(): void
    {
        // no-op
    }
};
