<?php
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\PostController;
Route::apiResources([
    'posts' => PostController::class,
]);
