<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\MonitorController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\StagiaireController;
use App\Http\Controllers\Api\SupportMessageController;
use App\Http\Controllers\Api\TerrainController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/email/verify-code', [AuthController::class, 'verifyEmailCode'])->middleware('throttle:10,1');
Route::post('/email/resend-verification', [AuthController::class, 'resendEmailVerificationCode'])->middleware('throttle:3,1');
Route::post('/password/forgot', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
Route::post('/password/verify-code', [AuthController::class, 'verifyResetCode'])->middleware('throttle:10,1');
Route::post('/password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

Route::middleware('auth.api')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateMe']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/me/password', [AuthController::class, 'updatePassword']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/terrains', [TerrainController::class, 'index']);
    Route::post('/terrains', [TerrainController::class, 'store'])->middleware('admin.only');
    Route::put('/terrains/{terrain}', [TerrainController::class, 'update'])->middleware('admin.only');
    Route::delete('/terrains/{terrain}', [TerrainController::class, 'destroy'])->middleware('admin.only');

    Route::get('/matches', [MatchController::class, 'index']);
    Route::post('/matches', [MatchController::class, 'store'])->middleware('admin.only');
    Route::put('/matches/{match}', [MatchController::class, 'update'])->middleware('admin.only');
    Route::delete('/matches/{match}', [MatchController::class, 'destroy'])->middleware('admin.only');

    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::get('/reservations/code/{code}', [ReservationController::class, 'findByCode']);
    Route::post('/reservations/confirm-by-qr', [ReservationController::class, 'confirmByQr']);
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::post('/reservations/{reservation}/players', [ReservationController::class, 'addPlayer']);
    Route::delete('/reservations/{reservation}/players/{player}', [ReservationController::class, 'removePlayer']);
    Route::patch('/reservations/{reservation}/status', [ReservationController::class, 'updateStatus']);
    Route::patch('/reservations/{reservation}/cancel-self', [ReservationController::class, 'cancelOwn']);
    Route::put('/reservations/{reservation}', [ReservationController::class, 'update'])->middleware('admin.only');
    Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy'])->middleware('admin.only');

    Route::get('/stagiaires', [StagiaireController::class, 'index'])->middleware('admin.only');
    Route::post('/stagiaires', [StagiaireController::class, 'store'])->middleware('admin.only');
    Route::put('/stagiaires/{stagiaire}', [StagiaireController::class, 'update'])->middleware('admin.only');
    Route::delete('/stagiaires/{stagiaire}', [StagiaireController::class, 'destroy'])->middleware('admin.only');

    Route::get('/monitors', [MonitorController::class, 'index'])->middleware('admin.only');
    Route::post('/monitors', [MonitorController::class, 'store'])->middleware('admin.only');
    Route::put('/monitors/{monitor}', [MonitorController::class, 'update'])->middleware('admin.only');
    Route::delete('/monitors/{monitor}', [MonitorController::class, 'destroy'])->middleware('admin.only');

    Route::post('/support-messages', [SupportMessageController::class, 'store']);
    Route::get('/support-messages', [SupportMessageController::class, 'index'])->middleware('admin.only');
});
