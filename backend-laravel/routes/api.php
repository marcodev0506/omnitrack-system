<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\MobileAuthController; // No olvides importar el controlador

// Esta es la ruta para el login del transportista
Route::post('/login-mobile', [MobileAuthController::class, 'login']);

// Esta ruta viene por defecto para probar que el token funciona
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});