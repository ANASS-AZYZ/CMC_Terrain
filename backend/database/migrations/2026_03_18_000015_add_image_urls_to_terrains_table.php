<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('terrains', function (Blueprint $table): void {
            $table->json('image_urls')->nullable()->after('image_url');
        });
    }

    public function down(): void
    {
        Schema::table('terrains', function (Blueprint $table): void {
            $table->dropColumn('image_urls');
        });
    }
};
