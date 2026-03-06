<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('password_reset_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('email')->index();
            $table->string('code_hash', 64);
            $table->string('reset_token_hash', 64)->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('verified_at')->nullable();
            $table->dateTime('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_codes');
    }
};
