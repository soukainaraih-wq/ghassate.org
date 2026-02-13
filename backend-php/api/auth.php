<?php

declare(strict_types=1);

/**
 * Lightweight JWT implementation using HMAC-SHA256.
 * No external dependencies required.
 */

function jwt_base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function jwt_base64url_decode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder > 0) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'), true) ?: '';
}

function jwt_create(array $payload, string $secret, int $expirySeconds = 7200): string
{
    $header = jwt_base64url_encode(json_encode([
        'alg' => 'HS256',
        'typ' => 'JWT',
    ], JSON_UNESCAPED_SLASHES));

    $now = time();
    $payload['iat'] = $now;
    $payload['exp'] = $now + $expirySeconds;
    $payload['jti'] = bin2hex(random_bytes(16));

    $payloadEncoded = jwt_base64url_encode(json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

    $signature = jwt_base64url_encode(
        hash_hmac('sha256', "$header.$payloadEncoded", $secret, true)
    );

    return "$header.$payloadEncoded.$signature";
}

function jwt_verify(string $token, string $secret): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

    $expectedSignature = jwt_base64url_encode(
        hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $secret, true)
    );

    if (!hash_equals($expectedSignature, $signatureEncoded)) {
        return null;
    }

    $payload = json_decode(jwt_base64url_decode($payloadEncoded), true);
    if (!is_array($payload)) {
        return null;
    }

    $now = time();
    if (isset($payload['exp']) && $now > (int) $payload['exp']) {
        return null; // expired
    }

    return $payload;
}

function handle_admin_login(
    string $method,
    string $lang,
    array $body,
    string $clientIp,
    array $authConfig,
    string $rateDir,
    int $rateWindowSeconds,
    int $maxRateKeys
): void {
    if ($method !== 'POST') {
        json_response(['message' => 'Method not allowed.'], 405);
    }

    // Rate limit login attempts strictly
    $loginRate = apply_rate_limit(
        $rateDir . '/login.json',
        'login:' . $clientIp,
        (int) $authConfig['login_rate_limit'],
        $rateWindowSeconds,
        $maxRateKeys
    );
    set_rate_headers('Login-RateLimit', $loginRate, (int) $authConfig['login_rate_limit']);

    if (!$loginRate['allowed']) {
        json_response(
            ['message' => text_by_lang(
                $lang,
                'تم تجاوز الحد المسموح من محاولات الدخول. حاول لاحقًا.',
                'Ttawweḍḍaḍ azrag n tikkal n unekcum. Eṛǧu kra.',
                'Too many login attempts. Please try again later.'
            )],
            429
        );
    }

    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');

    // Validate input
    if ($email === '' || $password === '') {
        json_response([
            'message' => text_by_lang(
                $lang,
                'يرجى إدخال البريد الإلكتروني وكلمة السر.',
                'Sekcem imayl d wawal uffir.',
                'Please enter email and password.'
            ),
        ], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response([
            'message' => text_by_lang(
                $lang,
                'البريد الإلكتروني غير صالح.',
                'Imayl ur iṣeḥḥ ara.',
                'Invalid email address.'
            ),
        ], 400);
    }

    $storedEmail = $authConfig['admin_email'] ?? '';
    $storedHash = $authConfig['admin_password_hash'] ?? '';
    $jwtSecret = $authConfig['jwt_secret'] ?? '';
    $jwtExpiry = (int) ($authConfig['jwt_expiry_seconds'] ?? 7200);

    if ($storedHash === '' || $jwtSecret === '') {
        json_response([
            'message' => text_by_lang(
                $lang,
                'نظام تسجيل الدخول غير مُعدّ بعد.',
                'Anagraw n unekcum ur ittwaheyya ara.',
                'Login system is not configured yet.'
            ),
        ], 503);
    }

    // Constant-time comparison for email + password verification
    $emailMatch = hash_equals($storedEmail, $email);
    $passwordMatch = password_verify($password, $storedHash);

    if (!$emailMatch || !$passwordMatch) {
        // Sleep to slow brute force (200-600ms random)
        usleep(random_int(200000, 600000));

        json_response([
            'message' => text_by_lang(
                $lang,
                'البريد الإلكتروني أو كلمة السر غير صحيحة.',
                'Imayl neɣ awal uffir ur iṣeḥḥ ara.',
                'Invalid email or password.'
            ),
        ], 401);
    }

    // Generate JWT
    $token = jwt_create([
        'sub' => $email,
        'role' => 'admin',
    ], $jwtSecret, $jwtExpiry);

    json_response([
        'message' => text_by_lang($lang, 'تم تسجيل الدخول بنجاح.', 'Anekcum yedda akken iwata.', 'Login successful.'),
        'token' => $token,
        'expiresIn' => $jwtExpiry,
    ]);
}

function authenticate_jwt_or_token(
    array $headers,
    array $config,
    array $authConfig
): bool {
    // Method 1: JWT Bearer token (new secure method)
    $authHeader = trim((string) ($headers['authorization'] ?? ''));
    if (str_starts_with($authHeader, 'Bearer ')) {
        $jwt = trim(substr($authHeader, 7));
        $jwtSecret = $authConfig['jwt_secret'] ?? '';
        if ($jwt !== '' && $jwtSecret !== '') {
            $payload = jwt_verify($jwt, $jwtSecret);
            if ($payload !== null && ($payload['role'] ?? '') === 'admin') {
                return true;
            }
        }
    }

    // Method 2: Legacy X-Admin-Token (backward compatible)
    $adminToken = trim((string) $config['admin_token']);
    $provided = trim((string) ($headers['x-admin-token'] ?? ''));
    if ($provided !== '' && $adminToken !== '' && hash_equals($adminToken, $provided)) {
        return true;
    }

    return false;
}
