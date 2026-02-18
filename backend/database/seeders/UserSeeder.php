<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'             => 'Admin User',
            'email'            => 'admin@aress.com',
            'password'         => Hash::make('password'),
            'role'             => 'admin',
            'theme_preference' => 'system',
        ]);

        $users = [
            ['name' => 'Sarah Johnson',  'email' => 'sarah@aress.com'],
            ['name' => 'Mike Chen',      'email' => 'mike@aress.com'],
            ['name' => 'Emma Williams',  'email' => 'emma@aress.com'],
            ['name' => 'James Martinez', 'email' => 'james@aress.com'],
            ['name' => 'Olivia Brown',   'email' => 'olivia@aress.com'],
        ];

        foreach ($users as $user) {
            User::create(array_merge($user, [
                'password'         => Hash::make('password'),
                'role'             => 'user',
                'theme_preference' => 'system',
            ]));
        }
    }
}
