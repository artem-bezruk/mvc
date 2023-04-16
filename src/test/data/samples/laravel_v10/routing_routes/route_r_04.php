<?php
use App\Http\Controllers\UserController;
use App\Models\User;
Route::get('/users/{user}', [UserController::class, 'show']);
public function show(User $user)
{
    return view('user.profile', ['user' => $user]);
}
