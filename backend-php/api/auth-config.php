<?php

declare(strict_types=1);

/**
 * Admin credentials store.
 *
 * ADMIN_PASSWORD_HASH is generated via: password_hash($password, PASSWORD_BCRYPT, ['cost' => 12])
 * To regenerate, run:   php -r "echo password_hash('YOUR_PASSWORD', PASSWORD_BCRYPT, ['cost' => 12]);"
 *
 * JWT_SECRET is used for signing session tokens (HMAC-SHA256).
 * Generate a strong secret:  php -r "echo bin2hex(random_bytes(32));"
 */

$adminEmail = strtolower(trim((string) (getenv('ADMIN_EMAIL') ?: 'aissamraih@gmail.com')));
$adminPasswordHash = trim((string) (getenv('ADMIN_PASSWORD_HASH') ?: ''));
$jwtSecret = trim((string) (getenv('JWT_SECRET') ?: ''));

// Auto-generate JWT_SECRET if not set (persist to file for consistency across requests)
$jwtSecretFile = __DIR__ . '/storage/.jwt-secret';
if ($jwtSecret === '') {
    if (file_exists($jwtSecretFile)) {
        $jwtSecret = trim((string) file_get_contents($jwtSecretFile));
    }
    if ($jwtSecret === '') {
        $jwtSecret = bin2hex(random_bytes(32));
        @file_put_contents($jwtSecretFile, $jwtSecret);
    }
}

// Auto-hash password on first deploy if raw ADMIN_PASSWORD env var is set
$rawPassword = trim((string) (getenv('ADMIN_PASSWORD') ?: ''));
$hashFile = __DIR__ . '/storage/.admin-hash';

if ($adminPasswordHash === '') {
    if (file_exists($hashFile)) {
        $adminPasswordHash = trim((string) file_get_contents($hashFile));
    }

    if ($adminPasswordHash === '' && $rawPassword !== '') {
        $adminPasswordHash = password_hash($rawPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        @file_put_contents($hashFile, $adminPasswordHash);
    }
}

return [
    'admin_email' => $adminEmail,
    'admin_password_hash' => $adminPasswordHash,
    'jwt_secret' => $jwtSecret,
    'jwt_expiry_seconds' => (int) (getenv('JWT_EXPIRY_SECONDS') ?: 7200), // 2 hours
    'login_rate_limit' => 5,  // max 5 login attempts per window
];
