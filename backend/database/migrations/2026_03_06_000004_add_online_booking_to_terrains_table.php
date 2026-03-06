<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('terrains', function (Blueprint $table): void {
            $table->boolean('online_booking')->default(true)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('terrains', function (Blueprint $table): void {
            $table->dropColumn('online_booking');
        });
    }
};
