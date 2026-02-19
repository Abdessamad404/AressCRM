<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'        => $request->name,
            'email'       => $request->email,
            'password'    => $request->password,
            'client_type' => $request->client_type ?? null,
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data' => array_merge((new UserResource($user))->resolve(), ['token' => $token]),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user  = User::where('email', $request->email)->firstOrFail();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data' => array_merge((new UserResource($user))->resolve(), ['token' => $token]),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json(['data' => new UserResource($request->user())]);
    }
}
