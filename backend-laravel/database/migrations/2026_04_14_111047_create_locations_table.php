<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('locations', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained(); // Relación con el chofer
        $table->decimal('lat', 10, 8);
        $table->decimal('lng', 11, 8);
        $table->timestamps(); // Esto nos dará 'created_at' para saber la hora exacta
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
