<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Admin ─────────────────────────────────────────────────────────
        User::create([
            'name'             => 'Admin User',
            'email'            => 'admin@aress.com',
            'password'         => 'password',
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
                'password'         => 'password',
                'role'             => 'user',
                'theme_preference' => 'system',
            ]));
        }

        $statuses = ['New', 'Contacted', 'Interested', 'Negotiation', 'Won', 'Lost'];
        $sources  = ['LinkedIn', 'Referral', 'Cold call', 'Website', 'Other'];

        // ── 3. Entreprise clients (appear as leads in admin CRM) ──────────────
        $entreprises = [
            ['name' => 'TechNova HR',      'email' => 'hr@technova.com',              'company' => 'TechNova',         'phone' => '+1-555-0201'],
            ['name' => 'Nexus Consulting', 'email' => 'jobs@nexusconsult.io',         'company' => 'Nexus Consulting',  'phone' => '+1-555-0202'],
            ['name' => 'Bright Ventures',  'email' => 'talent@brightventures.co',     'company' => 'Bright Ventures',   'phone' => '+1-555-0203'],
            ['name' => 'Atlas Group',      'email' => 'recrutement@atlasgroup.fr',    'company' => 'Atlas Group',       'phone' => '+33-555-0204'],
        ];

        foreach ($entreprises as $i => $ent) {
            User::create(array_merge($ent, [
                'password'         => 'password',
                'role'             => 'user',
                'client_type'      => 'entreprise',
                'theme_preference' => 'system',
                'source'           => $sources[$i % count($sources)],
                'lead_status'      => $statuses[$i % count($statuses)],
                'notes'            => 'Entreprise client. Initial contact made.',
            ]));
        }

        // ── 4. Commercial / candidate clients (appear as leads in admin CRM) ──
        $commercials = [
            ['name' => 'Karim Bensalem',  'email' => 'karim.b@mail.com',   'company' => 'Freelance',        'phone' => '+213-555-0301'],
            ['name' => 'Leila Ferhat',    'email' => 'leila.f@mail.com',   'company' => 'Self-employed',     'phone' => '+213-555-0302'],
            ['name' => 'Yassine Ouhadi',  'email' => 'yassine.o@mail.com', 'company' => 'DevStudio',         'phone' => '+212-555-0303'],
            ['name' => 'Camille Dupont',  'email' => 'camille.d@mail.com', 'company' => 'Agence Dupont',     'phone' => '+33-555-0304'],
            ['name' => 'Adrien Moreau',   'email' => 'adrien.m@mail.com',  'company' => 'Moreau & Partners', 'phone' => '+33-555-0305'],
            ['name' => 'Nadia Cherkaoui', 'email' => 'nadia.c@mail.com',   'company' => 'NC Consulting',     'phone' => '+212-555-0306'],
        ];

        foreach ($commercials as $i => $com) {
            User::create(array_merge($com, [
                'password'         => 'password',
                'role'             => 'user',
                'client_type'      => 'commercial',
                'theme_preference' => 'system',
                'source'           => $sources[($i + 2) % count($sources)],
                'lead_status'      => $statuses[($i + 1) % count($statuses)],
                'notes'            => 'Commercial candidate. Portfolio under review.',
            ]));
        }
    }
}
