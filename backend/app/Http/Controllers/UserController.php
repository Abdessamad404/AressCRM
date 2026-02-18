<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => UserResource::collection(User::all())]);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(['data' => new UserResource($user)]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'             => ['sometimes', 'required', 'string', 'max:255'],
            'email'            => ['sometimes', 'required', 'email', 'unique:users,email,' . $user->id],
            'role'             => ['sometimes', 'in:admin,user'],
            'theme_preference' => ['sometimes', 'in:light,dark,system'],
        ]);

        $user->update($data);

        return response()->json(['data' => new UserResource($user)]);
    }

    public function updateTheme(Request $request, User $user): JsonResponse
    {
        // Users can only update their own theme
        if ($request->user()->id !== $user->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate(['theme_preference' => ['required', 'in:light,dark,system']]);
        $user->update(['theme_preference' => $request->theme_preference]);

        return response()->json(['data' => new UserResource($user)]);
    }
}
