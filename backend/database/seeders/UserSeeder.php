<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Admin ─────────────────────────────────────────────────────────
        User::create([
            'name'             => 'Admin User',
            'email'            => 'admin@aress.com',
            'password'         => Hash::make('password'),
            'role'             => 'admin',
            'theme_preference' => 'system',
        ]);

        // ── 2. Internal CRM agents (role = user, no client_type) ─────────────
        $agents = [
            ['name' => 'Sarah Johnson',  'email' => 'sarah@aress.com'],
            ['name' => 'Mike Chen',      'email' => 'mike@aress.com'],
            ['name' => 'Emma Williams',  'email' => 'emma@aress.com'],
            ['name' => 'James Martinez', 'email' => 'james@aress.com'],
            ['name' => 'Olivia Brown',   'email' => 'olivia@aress.com'],
        ];

        foreach ($agents as $agent) {
            User::create(array_merge($agent, [
                'password'         => Hash::make('password'),
                'role'             => 'user',
                'theme_preference' => 'system',
            ]));
        }

        // ── 3. Entreprise clients ─────────────────────────────────────────────
        $entreprises = [
            ['name' => 'TechNova HR',      'email' => 'hr@technova.com'],
            ['name' => 'Nexus Consulting', 'email' => 'jobs@nexusconsult.io'],
            ['name' => 'Bright Ventures',  'email' => 'talent@brightventures.co'],
            ['name' => 'Atlas Group',      'email' => 'recrutement@atlasgroup.fr'],
        ];

        foreach ($entreprises as $ent) {
            User::create(array_merge($ent, [
                'password'         => Hash::make('password'),
                'role'             => 'user',
                'client_type'      => 'entreprise',
                'theme_preference' => 'system',
            ]));
        }

        // ── 4. Commercial / candidate clients ─────────────────────────────────
        $commercials = [
            ['name' => 'Karim Bensalem',  'email' => 'karim.b@mail.com'],
            ['name' => 'Leila Ferhat',    'email' => 'leila.f@mail.com'],
            ['name' => 'Yassine Ouhadi',  'email' => 'yassine.o@mail.com'],
            ['name' => 'Camille Dupont',  'email' => 'camille.d@mail.com'],
            ['name' => 'Adrien Moreau',   'email' => 'adrien.m@mail.com'],
            ['name' => 'Nadia Cherkaoui', 'email' => 'nadia.c@mail.com'],
        ];

        foreach ($commercials as $com) {
            User::create(array_merge($com, [
                'password'         => Hash::make('password'),
                'role'             => 'user',
                'client_type'      => 'commercial',
                'theme_preference' => 'system',
            ]));
        }
    }
}
