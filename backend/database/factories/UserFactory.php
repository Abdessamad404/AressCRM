<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name'             => fake()->name(),
            'email'            => fake()->unique()->safeEmail(),
            'email_verified_at'=> now(),
            'password'         => static::$password ??= Hash::make('password'),
            'remember_token'   => Str::random(10),
            'role'             => 'user',
            'client_type'      => null,
            'theme_preference' => 'system',
        ];
    }

    /** Internal CRM agent (no client_type) */
    public function agent(): static
    {
        return $this->state(fn () => [
            'role'        => 'user',
            'client_type' => null,
        ]);
    }

    /** Entreprise (hiring company) client */
    public function entreprise(): static
    {
        return $this->state(fn () => [
            'role'        => 'user',
            'client_type' => 'entreprise',
        ]);
    }

    /** Commercial / salesperson / candidate client */
    public function commercial(): static
    {
        return $this->state(fn () => [
            'role'        => 'user',
            'client_type' => 'commercial',
        ]);
    }

    /** Unverified email */
    public function unverified(): static
    {
        return $this->state(fn () => [
            'email_verified_at' => null,
        ]);
    }
}
