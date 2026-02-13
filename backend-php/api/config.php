<?php

declare(strict_types=1);

function env_bool(string $key, bool $default = false): bool
{
    $raw = getenv($key);
    if ($raw === false) {
        return $default;
    }

    $value = strtolower(trim((string) $raw));
    if ($value === '1' || $value === 'true' || $value === 'yes' || $value === 'on') {
        return true;
    }
    if ($value === '0' || $value === 'false' || $value === 'no' || $value === 'off') {
        return false;
    }

    return $default;
}

function env_int(string $key, int $default, int $min, int $max): int
{
    $raw = getenv($key);
    if ($raw === false || trim((string) $raw) === '') {
        return $default;
    }

    $parsed = (int) $raw;
    if ($parsed < $min) {
        return $min;
    }
    if ($parsed > $max) {
        return $max;
    }

    return $parsed;
}

$frontendOrigin = trim((string) (getenv('FRONTEND_ORIGIN') ?: 'https://ghassate.org'));
$publicOrigin = trim((string) (getenv('PUBLIC_ORIGIN') ?: $frontendOrigin));
$extraOriginsRaw = trim((string) (getenv('FRONTEND_EXTRA_ORIGINS') ?: ''));
$extraOrigins = [];

if ($extraOriginsRaw !== '') {
    foreach (explode(',', $extraOriginsRaw) as $origin) {
        $normalized = rtrim(trim($origin), '/');
        if ($normalized !== '') {
            $extraOrigins[] = $normalized;
        }
    }
}

return [
    'app_env' => strtolower(trim((string) (getenv('APP_ENV') ?: 'production'))),
    'allow_no_origin' => env_bool('ALLOW_NO_ORIGIN', false),
    'enable_admin_endpoint' => env_bool('ENABLE_ADMIN_ENDPOINT', false),
    // Production-safe default: no fallback token.
    // In development, set ADMIN_TOKEN explicitly if needed.
    'admin_token' => trim((string) (getenv('ADMIN_TOKEN') ?: '')),
    'min_admin_token_length' => 32,
    'frontend_origin' => rtrim($frontendOrigin, '/'),
    'public_origin' => rtrim($publicOrigin, '/'),
    'extra_origins' => $extraOrigins,
    'rate_window_seconds' => env_int('RATE_WINDOW_SECONDS', 60, 10, 300),
    'generic_rate_limit' => env_int('GENERIC_RATE_LIMIT', 120, 20, 5000),
    'contact_rate_limit' => env_int('CONTACT_RATE_LIMIT', 7, 2, 200),
    'newsletter_rate_limit' => env_int('NEWSLETTER_RATE_LIMIT', 10, 2, 200),
    'admin_rate_limit' => env_int('ADMIN_RATE_LIMIT', 15, 3, 300),
    'max_rate_keys' => env_int('MAX_RATE_KEYS', 20000, 1000, 200000),
    'max_stored_records' => env_int('MAX_STORED_RECORDS', 1000, 100, 100000),
    'max_json_body_bytes' => env_int('MAX_JSON_BODY_BYTES', 122880, 2048, 1048576),
    'max_url_length' => env_int('MAX_URL_LENGTH', 2048, 256, 8192),
    'min_form_fill_ms' => env_int('MIN_FORM_FILL_MS', 1200, 200, 120000),
    'max_form_age_ms' => env_int('MAX_FORM_AGE_MS', 86400000, 30000, 259200000),
];
