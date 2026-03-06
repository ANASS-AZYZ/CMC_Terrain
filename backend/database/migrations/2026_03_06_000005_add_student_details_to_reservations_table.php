<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table): void {
            $table->string('first_name')->nullable()->after('match_id');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('cin', 40)->nullable()->after('student_name');
            $table->string('class_name')->nullable()->after('student_email');
            $table->string('filiere')->nullable()->after('class_name');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table): void {
            $table->dropColumn(['first_name', 'last_name', 'cin', 'class_name', 'filiere']);
        });
    }
};
