<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

// Actualizar o crear usuario
$email = 'chofer@test.com';
$password = '123456';

$user = User::where('email', $email)->first();

if ($user) {
    $user->password = bcrypt($password);
    $user->save();
    echo "✅ Contraseña actualizada para: $email\n";
    echo "   Nueva contraseña: $password\n";
} else {
    $user = User::create([
        'name' => 'Chofer Test',
        'email' => $email,
        'password' => bcrypt($password)
    ]);
    echo "✅ Usuario creado: $email\n";
    echo "   Contraseña: $password\n";
    echo "   ID: {$user->id}\n";
}

echo "\n📱 Usa estas credenciales en la app Expo Go:\n";
echo "   Email: $email\n";
echo "   Password: $password\n";
