<?php
use App\Http\Controllers\PhotoController;
Route::resource('photos', PhotoController::class)->except([
    'create', 'store', 'update', 'destroy'
]);
