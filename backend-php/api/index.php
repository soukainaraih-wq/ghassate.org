<?php

declare(strict_types=1);

$config = require __DIR__ . '/config.php';

$storageDir = __DIR__ . '/storage';
$rateDir = $storageDir . '/rate';
$cmsStorePath = $storageDir . '/cms-store.json';
$contactPath = $storageDir . '/contact-submissions.json';
$newsletterPath = $storageDir . '/newsletter-subscribers.json';

ensure_directory($storageDir);
ensure_directory($rateDir);
ensure_json_file($cmsStorePath, default_cms_store());
ensure_json_file($contactPath, []);
ensure_json_file($newsletterPath, []);

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$routePath = resolve_route_path();

if (strlen($routePath) > (int) $config['max_url_length']) {
    json_response(['message' => 'Request URI is too long.'], 414);
}

apply_api_headers();

$headers = normalized_headers();
$origin = normalize_origin($headers['origin'] ?? '');
$refererOrigin = parse_origin_from_referer($headers['referer'] ?? '');
$allowedOrigins = build_allowed_origins($config);

$corsAllowed = cors_is_allowed(
    $origin,
    $refererOrigin,
    $allowedOrigins,
    (bool) $config['allow_no_origin'],
    is_read_only_method($method)
);

if (!$corsAllowed) {
    $lang = normalize_lang($_GET['lang'] ?? 'ar');
    json_response(
        ['message' => text_by_lang($lang, 'تم رفض الطلب بسبب سياسة المصدر.', 'Yettwagi usuter ilmend n tasertit n uɣbalu.', 'Request blocked by origin policy.')],
        403
    );
}

apply_cors_headers($origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (!is_allowed_method($method)) {
    json_response(['message' => 'Method not allowed.'], 405);
}

$clientIp = get_client_ip();
$queryLang = normalize_lang($_GET['lang'] ?? null);

$apiRate = apply_rate_limit(
    $rateDir . '/api.json',
    'api:' . $clientIp,
    (int) $config['generic_rate_limit'],
    (int) $config['rate_window_seconds'],
    (int) $config['max_rate_keys']
);
set_rate_headers('RateLimit', $apiRate, (int) $config['generic_rate_limit']);

if (!$apiRate['allowed']) {
    json_response(
        ['message' => text_by_lang($queryLang, 'تم تجاوز معدل الطلبات المسموح. حاول لاحقًا.', 'Iɣli ufella n usuter. Eṛǧu kra n wakud.', 'Too many requests. Please retry later.')],
        429
    );
}

$body = [];
if (is_write_method($method)) {
    ensure_json_request($headers);
    $body = read_json_body((int) $config['max_json_body_bytes']);
    if (contains_blocked_object_keys($body)) {
        json_response(['message' => 'Blocked payload.'], 400);
    }
}

$lang = normalize_lang($body['lang'] ?? ($_GET['lang'] ?? 'ar'));

if ($routePath === '/health' && is_read_only_method($method)) {
    if (($config['app_env'] ?? 'production') === 'production') {
        json_response([
            'status' => 'ok',
            'time' => gmdate('c'),
        ]);
    }

    json_response([
        'status' => 'ok',
        'service' => 'ghassate-php-backend',
        'environment' => $config['app_env'] ?? 'production',
        'time' => gmdate('c'),
    ]);
}

if (str_starts_with($routePath, '/admin')) {
    handle_admin_routes(
        $routePath,
        $method,
        $lang,
        $headers,
        $body,
        $clientIp,
        $config,
        $cmsStorePath,
        $contactPath,
        $newsletterPath,
        $rateDir,
        $allowedOrigins,
        $origin,
        $refererOrigin
    );
}

if ($routePath === '/projects' && is_read_only_method($method)) {
    $store = load_cms_store($cmsStorePath);
    $items = array_map(
        static fn(array $project): array => map_project_by_lang($project, $lang),
        $store['projects']
    );
    json_response([
        'lang' => $lang,
        'total' => count($items),
        'items' => array_values($items),
    ]);
}

if (preg_match('#^/projects/([a-z0-9-]+)$#', $routePath, $matches) === 1 && is_read_only_method($method)) {
    $slug = $matches[1];
    $store = load_cms_store($cmsStorePath);
    $project = null;

    foreach ($store['projects'] as $item) {
        if (($item['slug'] ?? '') === $slug) {
            $project = $item;
            break;
        }
    }

    if ($project === null) {
        json_response(['message' => 'Project not found.'], 404);
    }

    json_response(map_project_by_lang($project, $lang));
}

if ($routePath === '/news' && is_read_only_method($method)) {
    $store = load_cms_store($cmsStorePath);
    $items = array_map(
        static fn(array $item): array => map_news_by_lang($item, $lang),
        $store['news']
    );
    json_response([
        'lang' => $lang,
        'total' => count($items),
        'items' => array_values($items),
    ]);
}

if (preg_match('#^/news/([a-z0-9-]+)$#', $routePath, $matches) === 1 && is_read_only_method($method)) {
    $slug = $matches[1];
    $store = load_cms_store($cmsStorePath);
    $newsItem = null;

    foreach ($store['news'] as $entry) {
        if (($entry['slug'] ?? '') === $slug) {
            $newsItem = $entry;
            break;
        }
    }

    if ($newsItem === null) {
        json_response(['message' => 'News item not found.'], 404);
    }

    json_response(map_news_by_lang($newsItem, $lang));
}

if ($routePath === '/pages' && is_read_only_method($method)) {
    $store = load_cms_store($cmsStorePath);
    $items = array_values(array_filter(
        $store['pages'],
        static fn(array $item): bool => strtolower((string) ($item['status'] ?? 'published')) === 'published'
    ));
    $mapped = array_map(
        static fn(array $item): array => map_page_by_lang($item, $lang),
        $items
    );
    json_response([
        'lang' => $lang,
        'total' => count($mapped),
        'items' => array_values($mapped),
    ]);
}

if (preg_match('#^/pages/([a-z0-9-]+)$#', $routePath, $matches) === 1 && is_read_only_method($method)) {
    $slug = $matches[1];
    $store = load_cms_store($cmsStorePath);
    $page = null;

    foreach ($store['pages'] as $entry) {
        if (($entry['slug'] ?? '') !== $slug) {
            continue;
        }
        if (strtolower((string) ($entry['status'] ?? 'published')) !== 'published') {
            continue;
        }
        $page = $entry;
        break;
    }

    if ($page === null) {
        json_response(['message' => 'Page not found.'], 404);
    }

    json_response(map_page_by_lang($page, $lang));
}

if ($routePath === '/impact' && is_read_only_method($method)) {
    $store = load_cms_store($cmsStorePath);
    $impact = is_array($store['impact'] ?? null) ? $store['impact'] : [];
    $items = is_array($impact[$lang] ?? null)
        ? $impact[$lang]
        : (is_array($impact['ar'] ?? null) ? $impact['ar'] : []);

    json_response([
        'lang' => $lang,
        'items' => array_values($items),
    ]);
}

if ($routePath === '/settings' && is_read_only_method($method)) {
    $store = load_cms_store($cmsStorePath);
    json_response([
        'lang' => $lang,
        'settings' => map_settings_by_lang($store['settings'], $lang),
        'updatedAt' => $store['updatedAt'],
    ]);
}

if ($routePath === '/contact' && $method === 'POST') {
    enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);

    $contactRate = apply_rate_limit(
        $rateDir . '/contact.json',
        'contact:' . $clientIp,
        (int) $config['contact_rate_limit'],
        (int) $config['rate_window_seconds'],
        (int) $config['max_rate_keys']
    );
    set_rate_headers('Contact-RateLimit', $contactRate, (int) $config['contact_rate_limit']);

    if (!$contactRate['allowed']) {
        json_response(
            ['message' => text_by_lang($lang, 'تم تجاوز الحد المسموح من المحاولات. حاول بعد دقيقة.', 'Ttawweḍḍaḍ azrag n tikkal. Eṛǧu taseddaqiqt.', 'Rate limit reached. Please retry in one minute.')],
            429
        );
    }

    $validated = validate_contact_payload($body, $config);
    if (!$validated['valid']) {
        json_response([
            'message' => 'Validation failed.',
            'errors' => $validated['errors'],
        ], 400);
    }

    $submissions = mutate_json_file(
        $contactPath,
        static function ($current) use ($validated, $config): array {
            $list = is_array($current) ? array_values($current) : [];
            $entry = [
                'id' => count($list) + 1,
                'name' => $validated['data']['name'],
                'email' => $validated['data']['email'],
                'subject' => $validated['data']['subject'],
                'message' => $validated['data']['message'],
                'lang' => $validated['data']['lang'],
                'createdAt' => gmdate('c'),
            ];

            $list[] = $entry;
            trim_records($list, (int) $config['max_stored_records']);
            return $list;
        },
        []
    );

    $last = end($submissions);
    if (!is_array($last)) {
        $last = ['id' => 0];
    }

    json_response([
        'message' => text_by_lang($lang, 'تم استلام رسالتك بنجاح.', 'Ttwassel-d izen inek s umata.', 'Your message has been received successfully.'),
        'id' => (int) ($last['id'] ?? 0),
    ], 201);
}

if ($routePath === '/newsletter' && $method === 'POST') {
    enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);

    $newsletterRate = apply_rate_limit(
        $rateDir . '/newsletter.json',
        'newsletter:' . $clientIp,
        (int) $config['newsletter_rate_limit'],
        (int) $config['rate_window_seconds'],
        (int) $config['max_rate_keys']
    );
    set_rate_headers('Newsletter-RateLimit', $newsletterRate, (int) $config['newsletter_rate_limit']);

    if (!$newsletterRate['allowed']) {
        json_response(
            ['message' => text_by_lang($lang, 'تم تجاوز الحد المسموح من المحاولات. حاول بعد دقيقة.', 'Ttawweḍḍaḍ azrag n tikkal. Eṛǧu taseddaqiqt.', 'Rate limit reached. Please retry in one minute.')],
            429
        );
    }

    $validated = validate_newsletter_payload($body, $config);
    if (!$validated['valid']) {
        json_response([
            'message' => 'Validation failed.',
            'errors' => $validated['errors'],
        ], 400);
    }

    $result = ['exists' => false, 'id' => 0];

    mutate_json_file(
        $newsletterPath,
        static function ($current) use ($validated, $config, &$result): array {
            $list = is_array($current) ? array_values($current) : [];

            foreach ($list as $entry) {
                if (strcasecmp((string) ($entry['email'] ?? ''), $validated['data']['email']) === 0) {
                    $result = ['exists' => true, 'id' => (int) ($entry['id'] ?? 0)];
                    return $list;
                }
            }

            $next = [
                'id' => count($list) + 1,
                'email' => $validated['data']['email'],
                'lang' => $validated['data']['lang'],
                'createdAt' => gmdate('c'),
            ];
            $list[] = $next;
            trim_records($list, (int) $config['max_stored_records']);
            $result = ['exists' => false, 'id' => (int) $next['id']];
            return $list;
        },
        []
    );

    if ($result['exists']) {
        json_response([
            'message' => text_by_lang($lang, 'البريد الإلكتروني مشترك بالفعل.', 'Imayl-a yemmuden yakan.', 'This email is already subscribed.'),
        ]);
    }

    json_response([
        'message' => text_by_lang($lang, 'تم الاشتراك في النشرة البريدية.', 'Yella ummuden deg unebdu n imayl.', 'Newsletter subscription completed.'),
        'id' => $result['id'],
    ], 201);
}

json_response(['message' => 'Route not found.'], 404);

function handle_admin_routes(
    string $routePath,
    string $method,
    string $lang,
    array $headers,
    array $body,
    string $clientIp,
    array $config,
    string $cmsStorePath,
    string $contactPath,
    string $newsletterPath,
    string $rateDir,
    array $allowedOrigins,
    string $origin,
    string $refererOrigin
): void {
    if (!(bool) $config['enable_admin_endpoint']) {
        json_response(['message' => 'Route not found.'], 404);
    }

    $adminToken = trim((string) $config['admin_token']);
    $isProd = ($config['app_env'] ?? 'production') === 'production';
    $minLength = (int) ($config['min_admin_token_length'] ?? 32);

    if ($isProd && strlen($adminToken) < $minLength) {
        json_response(['message' => 'Admin endpoint is disabled due to missing secure token.'], 503);
    }

    $adminRate = apply_rate_limit(
        $rateDir . '/admin.json',
        'admin:' . $clientIp,
        (int) $config['admin_rate_limit'],
        (int) $config['rate_window_seconds'],
        (int) $config['max_rate_keys']
    );
    set_rate_headers('Admin-RateLimit', $adminRate, (int) $config['admin_rate_limit']);

    if (!$adminRate['allowed']) {
        json_response(
            ['message' => text_by_lang($lang, 'تم تجاوز الحد المسموح من محاولات الوصول إلى الإدارة.', 'Ttawweḍḍaḍ azrag n unekcum n tedbelt.', 'Admin access rate limit reached.')],
            429
        );
    }

    $provided = trim((string) ($headers['x-admin-token'] ?? ''));
    if ($provided === '' || !hash_equals($adminToken, $provided)) {
        json_response(['message' => 'Unauthorized.'], 401);
    }

    if ($routePath === '/admin/summary' && is_read_only_method($method)) {
        $store = load_cms_store($cmsStorePath);
        $contacts = read_json_file($contactPath, []);
        $subscribers = read_json_file($newsletterPath, []);

        json_response([
            'totals' => [
                'contactSubmissions' => is_array($contacts) ? count($contacts) : 0,
                'newsletterSubscribers' => is_array($subscribers) ? count($subscribers) : 0,
                'projects' => count($store['projects']),
                'news' => count($store['news']),
                'pages' => count($store['pages']),
                'media' => count($store['media']),
            ],
            'updatedAt' => $store['updatedAt'],
        ]);
    }

    if ($routePath === '/admin/cms' && is_read_only_method($method)) {
        $store = load_cms_store($cmsStorePath);
        json_response($store);
    }

    if ($routePath === '/admin/settings' && $method === 'PUT') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);

        $store = mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($body): array {
                $draft['settings'] = sanitize_settings_update($draft['settings'], $body);
                return $draft;
            }
        );

        json_response([
            'message' => 'Settings updated successfully.',
            'settings' => $store['settings'],
            'updatedAt' => $store['updatedAt'],
        ]);
    }

    if ($routePath === '/admin/projects' && $method === 'POST') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $result = null;

        $store = mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($body, &$result): array {
                $normalized = normalize_project_payload($body, $draft['projects'], null);
                if (!$normalized['valid']) {
                    $result = $normalized;
                    return $draft;
                }

                $nextId = (int) ($draft['nextIds']['projects'] ?? infer_next_id($draft['projects']));
                $draft['nextIds']['projects'] = $nextId + 1;

                $item = $normalized['data'];
                $item['id'] = $nextId;
                array_unshift($draft['projects'], $item);
                $result = ['valid' => true, 'item' => $item];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(['message' => (string) ($result['message'] ?? 'Invalid project payload.')], 400);
        }

        json_response([
            'message' => 'Project created successfully.',
            'item' => $result['item'],
            'total' => count($store['projects']),
        ], 201);
    }

    if (preg_match('#^/admin/projects/(\d+)$#', $routePath, $matches) === 1 && $method === 'PUT') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $targetId = (int) $matches[1];
        $result = null;

        mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($body, $targetId, &$result): array {
                $index = find_index_by_id($draft['projects'], $targetId);
                if ($index === -1) {
                    $result = ['valid' => false, 'status' => 404, 'message' => 'Project not found.'];
                    return $draft;
                }

                $current = $draft['projects'][$index];
                $normalized = normalize_project_payload($body, $draft['projects'], $current);
                if (!$normalized['valid']) {
                    $result = $normalized;
                    return $draft;
                }

                $updated = array_merge($current, $normalized['data']);
                $updated['id'] = (int) $current['id'];
                $draft['projects'][$index] = $updated;
                $result = ['valid' => true, 'item' => $updated];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(
                ['message' => (string) ($result['message'] ?? 'Invalid project payload.')],
                (int) ($result['status'] ?? 400)
            );
        }

        json_response([
            'message' => 'Project updated successfully.',
            'item' => $result['item'],
        ]);
    }

    if (preg_match('#^/admin/projects/(\d+)$#', $routePath, $matches) === 1 && $method === 'DELETE') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $targetId = (int) $matches[1];
        $result = null;

        mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($targetId, &$result): array {
                $before = count($draft['projects']);
                $draft['projects'] = array_values(array_filter(
                    $draft['projects'],
                    static fn(array $item): bool => (int) ($item['id'] ?? 0) !== $targetId
                ));

                if ($before === count($draft['projects'])) {
                    $result = ['valid' => false, 'status' => 404, 'message' => 'Project not found.'];
                    return $draft;
                }

                $result = ['valid' => true];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(
                ['message' => (string) ($result['message'] ?? 'Project could not be deleted.')],
                (int) ($result['status'] ?? 400)
            );
        }

        json_response(['message' => 'Project deleted successfully.']);
    }

    if ($routePath === '/admin/news' && $method === 'POST') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $result = null;

        $store = mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($body, &$result): array {
                $normalized = normalize_news_payload($body, $draft['news'], null);
                if (!$normalized['valid']) {
                    $result = $normalized;
                    return $draft;
                }

                $nextId = (int) ($draft['nextIds']['news'] ?? infer_next_id($draft['news']));
                $draft['nextIds']['news'] = $nextId + 1;

                $item = $normalized['data'];
                $item['id'] = $nextId;
                array_unshift($draft['news'], $item);
                $result = ['valid' => true, 'item' => $item];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(['message' => (string) ($result['message'] ?? 'Invalid news payload.')], 400);
        }

        json_response([
            'message' => 'News item created successfully.',
            'item' => $result['item'],
            'total' => count($store['news']),
        ], 201);
    }

    if (preg_match('#^/admin/news/(\d+)$#', $routePath, $matches) === 1 && $method === 'PUT') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $targetId = (int) $matches[1];
        $result = null;

        mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($body, $targetId, &$result): array {
                $index = find_index_by_id($draft['news'], $targetId);
                if ($index === -1) {
                    $result = ['valid' => false, 'status' => 404, 'message' => 'News item not found.'];
                    return $draft;
                }

                $current = $draft['news'][$index];
                $normalized = normalize_news_payload($body, $draft['news'], $current);
                if (!$normalized['valid']) {
                    $result = $normalized;
                    return $draft;
                }

                $updated = array_merge($current, $normalized['data']);
                $updated['id'] = (int) $current['id'];
                $draft['news'][$index] = $updated;
                $result = ['valid' => true, 'item' => $updated];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(
                ['message' => (string) ($result['message'] ?? 'Invalid news payload.')],
                (int) ($result['status'] ?? 400)
            );
        }

        json_response([
            'message' => 'News item updated successfully.',
            'item' => $result['item'],
        ]);
    }

    if (preg_match('#^/admin/news/(\d+)$#', $routePath, $matches) === 1 && $method === 'DELETE') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $targetId = (int) $matches[1];
        $result = null;

        mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($targetId, &$result): array {
                $before = count($draft['news']);
                $draft['news'] = array_values(array_filter(
                    $draft['news'],
                    static fn(array $item): bool => (int) ($item['id'] ?? 0) !== $targetId
                ));

                if ($before === count($draft['news'])) {
                    $result = ['valid' => false, 'status' => 404, 'message' => 'News item not found.'];
                    return $draft;
                }

                $result = ['valid' => true];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(
                ['message' => (string) ($result['message'] ?? 'News item could not be deleted.')],
                (int) ($result['status'] ?? 400)
            );
        }

        json_response(['message' => 'News item deleted successfully.']);
    }

    if ($routePath === '/admin/pages' && $method === 'POST') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $result = null;

        $store = mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($body, &$result): array {
                $normalized = normalize_page_payload($body, $draft['pages'], null);
                if (!$normalized['valid']) {
                    $result = $normalized;
                    return $draft;
                }

                $nextId = (int) ($draft['nextIds']['pages'] ?? infer_next_id($draft['pages']));
                $draft['nextIds']['pages'] = $nextId + 1;

                $item = $normalized['data'];
                $item['id'] = $nextId;
                array_unshift($draft['pages'], $item);
                $result = ['valid' => true, 'item' => $item];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(['message' => (string) ($result['message'] ?? 'Invalid page payload.')], 400);
        }

        json_response([
            'message' => 'Page created successfully.',
            'item' => $result['item'],
            'total' => count($store['pages']),
        ], 201);
    }

    if (preg_match('#^/admin/pages/(\d+)$#', $routePath, $matches) === 1 && $method === 'PUT') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $targetId = (int) $matches[1];
        $result = null;

        mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($body, $targetId, &$result): array {
                $index = find_index_by_id($draft['pages'], $targetId);
                if ($index === -1) {
                    $result = ['valid' => false, 'status' => 404, 'message' => 'Page not found.'];
                    return $draft;
                }

                $current = $draft['pages'][$index];
                $normalized = normalize_page_payload($body, $draft['pages'], $current);
                if (!$normalized['valid']) {
                    $result = $normalized;
                    return $draft;
                }

                $updated = array_merge($current, $normalized['data']);
                $updated['id'] = (int) $current['id'];
                $draft['pages'][$index] = $updated;
                $result = ['valid' => true, 'item' => $updated];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(
                ['message' => (string) ($result['message'] ?? 'Invalid page payload.')],
                (int) ($result['status'] ?? 400)
            );
        }

        json_response([
            'message' => 'Page updated successfully.',
            'item' => $result['item'],
        ]);
    }

    if (preg_match('#^/admin/pages/(\d+)$#', $routePath, $matches) === 1 && $method === 'DELETE') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $targetId = (int) $matches[1];
        $result = null;

        mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($targetId, &$result): array {
                $before = count($draft['pages']);
                $draft['pages'] = array_values(array_filter(
                    $draft['pages'],
                    static fn(array $item): bool => (int) ($item['id'] ?? 0) !== $targetId
                ));

                if ($before === count($draft['pages'])) {
                    $result = ['valid' => false, 'status' => 404, 'message' => 'Page not found.'];
                    return $draft;
                }

                $result = ['valid' => true];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(
                ['message' => (string) ($result['message'] ?? 'Page could not be deleted.')],
                (int) ($result['status'] ?? 400)
            );
        }

        json_response(['message' => 'Page deleted successfully.']);
    }

    if ($routePath === '/admin/media' && $method === 'POST') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $result = null;

        $store = mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($body, &$result): array {
                $normalized = normalize_media_payload($body, $draft['media'], null);
                if (!$normalized['valid']) {
                    $result = $normalized;
                    return $draft;
                }

                $nextId = (int) ($draft['nextIds']['media'] ?? infer_next_id($draft['media']));
                $draft['nextIds']['media'] = $nextId + 1;

                $item = $normalized['data'];
                $item['id'] = $nextId;
                array_unshift($draft['media'], $item);
                $result = ['valid' => true, 'item' => $item];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(['message' => (string) ($result['message'] ?? 'Invalid media payload.')], 400);
        }

        json_response([
            'message' => 'Media item created successfully.',
            'item' => $result['item'],
            'total' => count($store['media']),
        ], 201);
    }

    if (preg_match('#^/admin/media/(\d+)$#', $routePath, $matches) === 1 && $method === 'PUT') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $targetId = (int) $matches[1];
        $result = null;

        mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($body, $targetId, &$result): array {
                $index = find_index_by_id($draft['media'], $targetId);
                if ($index === -1) {
                    $result = ['valid' => false, 'status' => 404, 'message' => 'Media item not found.'];
                    return $draft;
                }

                $current = $draft['media'][$index];
                $normalized = normalize_media_payload($body, $draft['media'], $current);
                if (!$normalized['valid']) {
                    $result = $normalized;
                    return $draft;
                }

                $updated = array_merge($current, $normalized['data']);
                $updated['id'] = (int) $current['id'];
                $draft['media'][$index] = $updated;
                $result = ['valid' => true, 'item' => $updated];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(
                ['message' => (string) ($result['message'] ?? 'Invalid media payload.')],
                (int) ($result['status'] ?? 400)
            );
        }

        json_response([
            'message' => 'Media item updated successfully.',
            'item' => $result['item'],
        ]);
    }

    if (preg_match('#^/admin/media/(\d+)$#', $routePath, $matches) === 1 && $method === 'DELETE') {
        enforce_write_origin_or_fail($lang, $origin, $refererOrigin, $allowedOrigins, (bool) $config['allow_no_origin']);
        $targetId = (int) $matches[1];
        $result = null;

        mutate_cms_store(
            $cmsStorePath,
            static function (array $draft) use ($targetId, &$result): array {
                $before = count($draft['media']);
                $draft['media'] = array_values(array_filter(
                    $draft['media'],
                    static fn(array $item): bool => (int) ($item['id'] ?? 0) !== $targetId
                ));

                if ($before === count($draft['media'])) {
                    $result = ['valid' => false, 'status' => 404, 'message' => 'Media item not found.'];
                    return $draft;
                }

                $result = ['valid' => true];
                return $draft;
            }
        );

        if (!is_array($result) || !($result['valid'] ?? false)) {
            json_response(
                ['message' => (string) ($result['message'] ?? 'Media item could not be deleted.')],
                (int) ($result['status'] ?? 400)
            );
        }

        json_response(['message' => 'Media item deleted successfully.']);
    }

    json_response(['message' => 'Route not found.'], 404);
}

function resolve_route_path(): string
{
    $uriPath = (string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
    $scriptDir = rtrim(str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '/index.php'))), '/');
    if ($scriptDir === '.') {
        $scriptDir = '';
    }

    if ($scriptDir !== '' && str_starts_with($uriPath, $scriptDir)) {
        $uriPath = substr($uriPath, strlen($scriptDir));
    }

    $route = '/' . ltrim($uriPath, '/');
    if ($route === '/index.php') {
        $route = '/';
    }
    if ($route !== '/' && str_ends_with($route, '/')) {
        $route = rtrim($route, '/');
    }

    return $route;
}

function apply_api_headers(): void
{
    header_remove('X-Powered-By');
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('Cache-Control: no-store');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
}

function apply_cors_headers(string $origin, string $refererOrigin, array $allowedOrigins, bool $allowNoOrigin): void
{
    $resolved = '';
    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        $resolved = $origin;
    } elseif ($origin === '' && $refererOrigin !== '' && in_array($refererOrigin, $allowedOrigins, true)) {
        $resolved = $refererOrigin;
    } elseif ($origin === '' && $allowNoOrigin) {
        $resolved = '*';
    }

    if ($resolved !== '') {
        header('Access-Control-Allow-Origin: ' . $resolved);
    }

    header('Vary: Origin', false);
    header('Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
    header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');
    header('Access-Control-Max-Age: 600');
}

function cors_is_allowed(
    string $origin,
    string $refererOrigin,
    array $allowedOrigins,
    bool $allowNoOrigin,
    bool $isReadOnlyMethod
): bool {
    if ($origin !== '') {
        return in_array($origin, $allowedOrigins, true);
    }

    if ($refererOrigin !== '') {
        return in_array($refererOrigin, $allowedOrigins, true);
    }

    return $allowNoOrigin || $isReadOnlyMethod;
}

function enforce_write_origin_or_fail(
    string $lang,
    string $origin,
    string $refererOrigin,
    array $allowedOrigins,
    bool $allowNoOrigin
): void {
    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        return;
    }

    if ($origin === '' && $refererOrigin !== '' && in_array($refererOrigin, $allowedOrigins, true)) {
        return;
    }

    if ($origin === '' && $refererOrigin === '' && $allowNoOrigin) {
        return;
    }

    json_response(
        ['message' => text_by_lang($lang, 'تم رفض الطلب بسبب سياسة المصدر.', 'Yettwagi usuter ilmend n tasertit n uɣbalu.', 'Request blocked by origin policy.')],
        403
    );
}

function build_allowed_origins(array $config): array
{
    $origins = [
        normalize_origin($config['frontend_origin'] ?? ''),
        normalize_origin($config['public_origin'] ?? ''),
        'http://localhost:5151',
        'http://127.0.0.1:5151',
    ];

    if (is_array($config['extra_origins'] ?? null)) {
        foreach ($config['extra_origins'] as $origin) {
            $origins[] = normalize_origin((string) $origin);
        }
    }

    $clean = [];
    foreach ($origins as $origin) {
        if ($origin !== '' && !in_array($origin, $clean, true)) {
            $clean[] = $origin;
        }
    }

    return $clean;
}

function normalize_origin(string $origin): string
{
    return rtrim(trim($origin), '/');
}

function parse_origin_from_referer(string $referer): string
{
    if (trim($referer) === '') {
        return '';
    }

    $parts = parse_url($referer);
    if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
        return '';
    }

    $origin = strtolower($parts['scheme']) . '://' . strtolower((string) $parts['host']);
    if (isset($parts['port'])) {
        $origin .= ':' . (int) $parts['port'];
    }

    return normalize_origin($origin);
}

function normalized_headers(): array
{
    $headers = [];
    $raw = function_exists('getallheaders') ? getallheaders() : [];
    foreach ($raw as $name => $value) {
        $headers[strtolower((string) $name)] = is_array($value) ? (string) reset($value) : (string) $value;
    }

    return $headers;
}

function ensure_json_request(array $headers): void
{
    $type = strtolower(trim((string) ($headers['content-type'] ?? '')));
    if ($type === '' || (strpos($type, 'application/json') === false && strpos($type, 'application/') !== 0)) {
        json_response(['message' => 'Unsupported content type.'], 415);
    }
}

function read_json_body(int $maxBytes): array
{
    $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
    if ($contentLength > $maxBytes) {
        json_response(['message' => 'Request payload is too large.'], 413);
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    if (strlen($raw) > $maxBytes) {
        json_response(['message' => 'Request payload is too large.'], 413);
    }

    try {
        $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable $error) {
        json_response(['message' => 'Malformed JSON body.'], 400);
    }

    if (!is_array($decoded) || is_list_array($decoded)) {
        json_response(['message' => 'Invalid request payload.'], 400);
    }

    return $decoded;
}

function is_allowed_method(string $method): bool
{
    return in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'], true);
}

function is_read_only_method(string $method): bool
{
    return $method === 'GET' || $method === 'HEAD' || $method === 'OPTIONS';
}

function is_write_method(string $method): bool
{
    return $method === 'POST' || $method === 'PUT' || $method === 'PATCH' || $method === 'DELETE';
}

function is_list_array(array $value): bool
{
    if (function_exists('array_is_list')) {
        return array_is_list($value);
    }

    $index = 0;
    foreach ($value as $key => $_) {
        if ($key !== $index) {
            return false;
        }
        $index++;
    }

    return true;
}

function set_rate_headers(string $prefix, array $info, int $limit): void
{
    header($prefix . '-Limit: ' . $limit);
    header($prefix . '-Remaining: ' . (int) ($info['remaining'] ?? 0));
    header($prefix . '-Reset: ' . (int) ($info['reset'] ?? 0));
}

function apply_rate_limit(string $file, string $key, int $limit, int $windowSeconds, int $maxEntries): array
{
    $now = time();
    $result = ['allowed' => true, 'remaining' => $limit, 'reset' => $windowSeconds];

    mutate_json_file(
        $file,
        static function ($current) use ($key, $limit, $windowSeconds, $maxEntries, $now, &$result): array {
            $store = is_array($current) ? $current : [];

            foreach ($store as $entryKey => $entry) {
                if (!is_array($entry) || (int) ($entry['resetAt'] ?? 0) <= $now) {
                    unset($store[$entryKey]);
                }
            }

            if (!isset($store[$key]) || (int) ($store[$key]['resetAt'] ?? 0) <= $now) {
                $store[$key] = [
                    'count' => 0,
                    'resetAt' => $now + $windowSeconds,
                ];
            }

            $store[$key]['count'] = (int) ($store[$key]['count'] ?? 0) + 1;
            $store[$key]['resetAt'] = (int) ($store[$key]['resetAt'] ?? ($now + $windowSeconds));

            if (count($store) > $maxEntries) {
                uasort(
                    $store,
                    static fn($a, $b): int => ((int) ($a['resetAt'] ?? 0)) <=> ((int) ($b['resetAt'] ?? 0))
                );

                while (count($store) > $maxEntries) {
                    array_shift($store);
                }
            }

            $count = (int) ($store[$key]['count'] ?? 1);
            $resetAt = (int) ($store[$key]['resetAt'] ?? ($now + $windowSeconds));
            $remaining = max(0, $limit - $count);
            $reset = max(0, $resetAt - $now);

            $result = [
                'allowed' => $count <= $limit,
                'remaining' => $remaining,
                'reset' => $reset,
            ];

            return $store;
        },
        []
    );

    return $result;
}

function get_client_ip(): string
{
    $ip = trim((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
    if ($ip !== '') {
        return $ip;
    }

    $forwarded = trim((string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''));
    if ($forwarded !== '') {
        $parts = explode(',', $forwarded);
        $first = trim((string) ($parts[0] ?? ''));
        if ($first !== '') {
            return $first;
        }
    }

    return 'unknown';
}

function ensure_directory(string $path): void
{
    if (!is_dir($path)) {
        mkdir($path, 0775, true);
    }
}

function ensure_json_file(string $path, $default): void
{
    if (is_file($path)) {
        return;
    }

    write_json_file($path, $default);
}

function read_json_file(string $path, $default)
{
    if (!is_file($path)) {
        return $default;
    }

    $raw = file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        return $default;
    }

    $decoded = json_decode($raw, true);
    if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
        return $default;
    }

    return $decoded;
}

function write_json_file(string $path, $data): void
{
    ensure_directory(dirname($path));
    $encoded = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($encoded === false) {
        throw new RuntimeException('Unable to encode JSON data.');
    }
    file_put_contents($path, $encoded, LOCK_EX);
}

function mutate_json_file(string $path, callable $mutator, $default)
{
    ensure_directory(dirname($path));
    $handle = fopen($path, 'c+');
    if ($handle === false) {
        throw new RuntimeException('Unable to open storage file: ' . $path);
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            throw new RuntimeException('Unable to lock storage file: ' . $path);
        }

        rewind($handle);
        $raw = stream_get_contents($handle);
        $current = $default;
        if ($raw !== false && trim($raw) !== '') {
            $decoded = json_decode($raw, true);
            if (!($decoded === null && json_last_error() !== JSON_ERROR_NONE)) {
                $current = $decoded;
            }
        }

        $next = $mutator($current);
        $encoded = json_encode($next, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        if ($encoded === false) {
            throw new RuntimeException('Unable to encode updated storage data.');
        }

        rewind($handle);
        ftruncate($handle, 0);
        fwrite($handle, $encoded);
        fflush($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }

    return $next;
}

function default_cms_store(): array
{
    return [
        'version' => 1,
        'updatedAt' => gmdate('c'),
        'settings' => default_settings(),
        'projects' => [],
        'news' => [],
        'pages' => [],
        'impact' => ['ar' => [], 'zgh' => [], 'en' => []],
        'media' => [],
        'nextIds' => ['projects' => 1, 'news' => 1, 'pages' => 1, 'media' => 1],
    ];
}

function default_settings(): array
{
    return [
        'hero' => [
            'title' => ['ar' => '', 'zgh' => '', 'en' => ''],
            'text' => ['ar' => '', 'zgh' => '', 'en' => ''],
            'badge' => ['ar' => '', 'zgh' => '', 'en' => ''],
        ],
        'contact' => [
            'email' => '',
            'phone' => '',
            'address' => ['ar' => '', 'zgh' => '', 'en' => ''],
        ],
        'social' => [
            'facebook' => '',
            'instagram' => '',
            'linkedin' => '',
            'youtube' => '',
        ],
        'donation' => [
            'beneficiary' => '',
            'iban' => '',
            'bic' => '',
        ],
        'legal' => [
            'updatedAt' => gmdate('Y-m-d'),
            'registrationNumber' => '',
            'taxReference' => '',
        ],
    ];
}

function load_cms_store(string $path): array
{
    $store = read_json_file($path, default_cms_store());
    return normalize_store_structure(is_array($store) ? $store : default_cms_store());
}

function mutate_cms_store(string $path, callable $mutator): array
{
    return mutate_json_file(
        $path,
        static function ($current) use ($mutator): array {
            $draft = normalize_store_structure(is_array($current) ? $current : default_cms_store());
            $updated = $mutator($draft);
            $normalized = normalize_store_structure(is_array($updated) ? $updated : $draft);
            $normalized['version'] = 1;
            $normalized['updatedAt'] = gmdate('c');
            $normalized['nextIds'] = [
                'projects' => max(1, (int) ($normalized['nextIds']['projects'] ?? infer_next_id($normalized['projects']))),
                'news' => max(1, (int) ($normalized['nextIds']['news'] ?? infer_next_id($normalized['news']))),
                'pages' => max(1, (int) ($normalized['nextIds']['pages'] ?? infer_next_id($normalized['pages']))),
                'media' => max(1, (int) ($normalized['nextIds']['media'] ?? infer_next_id($normalized['media']))),
            ];
            return $normalized;
        },
        default_cms_store()
    );
}

function normalize_store_structure(array $store): array
{
    $seed = default_cms_store();

    $normalized = [
        'version' => 1,
        'updatedAt' => (string) ($store['updatedAt'] ?? gmdate('c')),
        'settings' => is_array($store['settings'] ?? null) ? $store['settings'] : $seed['settings'],
        'projects' => is_array($store['projects'] ?? null) ? array_values($store['projects']) : [],
        'news' => is_array($store['news'] ?? null) ? array_values($store['news']) : [],
        'pages' => is_array($store['pages'] ?? null) ? array_values($store['pages']) : [],
        'impact' => is_array($store['impact'] ?? null) ? $store['impact'] : $seed['impact'],
        'media' => is_array($store['media'] ?? null) ? array_values($store['media']) : [],
        'nextIds' => is_array($store['nextIds'] ?? null) ? $store['nextIds'] : $seed['nextIds'],
    ];

    if (!is_array($normalized['impact']['ar'] ?? null)) {
        $normalized['impact']['ar'] = [];
    }
    if (!is_array($normalized['impact']['zgh'] ?? null)) {
        $normalized['impact']['zgh'] = [];
    }
    if (!is_array($normalized['impact']['en'] ?? null)) {
        $normalized['impact']['en'] = [];
    }

    return $normalized;
}

function map_project_by_lang(array $project, string $lang): array
{
    $localizedLang = normalize_lang($lang);

    return [
        'id' => (int) ($project['id'] ?? 0),
        'slug' => (string) ($project['slug'] ?? ''),
        'category' => pick_localized($project['category'] ?? [], $localizedLang),
        'title' => pick_localized($project['title'] ?? [], $localizedLang),
        'excerpt' => pick_localized($project['excerpt'] ?? [], $localizedLang),
        'status' => pick_localized($project['status'] ?? [], $localizedLang),
        'budget' => pick_localized($project['budget'] ?? [], $localizedLang),
        'beneficiaries' => pick_localized($project['beneficiaries'] ?? [], $localizedLang),
        'implementationArea' => pick_localized($project['implementationArea'] ?? [], $localizedLang),
        'timeline' => pick_localized($project['timeline'] ?? [], $localizedLang),
        'objectives' => pick_localized_list($project['objectives'] ?? [], $localizedLang),
        'outcomes' => pick_localized_list($project['outcomes'] ?? [], $localizedLang),
        'partners' => pick_localized_list($project['partners'] ?? [], $localizedLang),
        'updatedAt' => format_public_date((string) ($project['updatedAt'] ?? ''), $localizedLang),
        'updatedAtIso' => (string) ($project['updatedAt'] ?? ''),
    ];
}

function map_news_by_lang(array $item, string $lang): array
{
    $localizedLang = normalize_lang($lang);

    return [
        'id' => (int) ($item['id'] ?? 0),
        'slug' => (string) ($item['slug'] ?? ''),
        'title' => pick_localized($item['title'] ?? [], $localizedLang),
        'excerpt' => pick_localized($item['excerpt'] ?? [], $localizedLang),
        'content' => pick_localized_list($item['content'] ?? [], $localizedLang),
        'keyPoints' => pick_localized_list($item['keyPoints'] ?? [], $localizedLang),
        'author' => pick_localized($item['author'] ?? [], $localizedLang),
        'publishedAt' => format_public_date((string) ($item['publishedAt'] ?? ''), $localizedLang),
        'publishedAtIso' => (string) ($item['publishedAt'] ?? ''),
    ];
}

function map_page_by_lang(array $item, string $lang): array
{
    $localizedLang = normalize_lang($lang);

    return [
        'id' => (int) ($item['id'] ?? 0),
        'slug' => (string) ($item['slug'] ?? ''),
        'title' => pick_localized($item['title'] ?? [], $localizedLang),
        'excerpt' => pick_localized($item['excerpt'] ?? [], $localizedLang),
        'content' => pick_localized_list($item['content'] ?? [], $localizedLang),
        'status' => strtolower(normalize_text($item['status'] ?? 'published')),
        'publishedAt' => format_public_date((string) ($item['publishedAt'] ?? ''), $localizedLang),
        'publishedAtIso' => (string) ($item['publishedAt'] ?? ''),
        'updatedAtIso' => (string) ($item['updatedAt'] ?? ''),
    ];
}

function map_settings_by_lang(array $settings, string $lang): array
{
    $localizedLang = normalize_lang($lang);

    return [
        'hero' => [
            'title' => pick_localized($settings['hero']['title'] ?? [], $localizedLang),
            'text' => pick_localized($settings['hero']['text'] ?? [], $localizedLang),
            'badge' => pick_localized($settings['hero']['badge'] ?? [], $localizedLang),
        ],
        'contact' => [
            'email' => normalize_text($settings['contact']['email'] ?? ''),
            'phone' => normalize_text($settings['contact']['phone'] ?? ''),
            'address' => pick_localized($settings['contact']['address'] ?? [], $localizedLang),
        ],
        'social' => [
            'facebook' => normalize_text($settings['social']['facebook'] ?? ''),
            'instagram' => normalize_text($settings['social']['instagram'] ?? ''),
            'linkedin' => normalize_text($settings['social']['linkedin'] ?? ''),
            'youtube' => normalize_text($settings['social']['youtube'] ?? ''),
        ],
        'donation' => [
            'beneficiary' => normalize_text($settings['donation']['beneficiary'] ?? ''),
            'iban' => normalize_text($settings['donation']['iban'] ?? ''),
            'bic' => normalize_text($settings['donation']['bic'] ?? ''),
        ],
        'legal' => [
            'updatedAt' => normalize_date($settings['legal']['updatedAt'] ?? ''),
            'registrationNumber' => normalize_text($settings['legal']['registrationNumber'] ?? ''),
            'taxReference' => normalize_text($settings['legal']['taxReference'] ?? ''),
        ],
    ];
}

function normalize_project_payload(array $payload, array $list, ?array $currentProject): array
{
    $title = sanitize_localized_text_map($payload['title'] ?? [], 180);
    $category = sanitize_localized_text_map($payload['category'] ?? [], 120);
    $excerpt = sanitize_localized_text_map($payload['excerpt'] ?? [], 320);

    if (!has_localized_value($title) || !has_localized_value($category) || !has_localized_value($excerpt)) {
        return ['valid' => false, 'message' => 'Project title, category, and excerpt are required.'];
    }

    $slugInput = create_slug_from_text((string) ($payload['slug'] ?? ''));
    $slugFallback = $title['en'] !== '' ? $title['en'] : ($title['ar'] !== '' ? $title['ar'] : 'project');
    $slug = resolve_unique_slug(
        $list,
        $slugInput,
        $slugFallback,
        $currentProject !== null ? (int) ($currentProject['id'] ?? 0) : null
    );

    return [
        'valid' => true,
        'data' => [
            'slug' => $slug,
            'category' => $category,
            'title' => $title,
            'excerpt' => $excerpt,
            'status' => sanitize_localized_text_map($payload['status'] ?? [], 120),
            'budget' => sanitize_localized_text_map($payload['budget'] ?? [], 80),
            'beneficiaries' => sanitize_localized_text_map($payload['beneficiaries'] ?? [], 100),
            'implementationArea' => sanitize_localized_text_map($payload['implementationArea'] ?? [], 220),
            'timeline' => sanitize_localized_text_map($payload['timeline'] ?? [], 160),
            'objectives' => sanitize_localized_list_map($payload['objectives'] ?? [], 12, 200),
            'outcomes' => sanitize_localized_list_map($payload['outcomes'] ?? [], 12, 200),
            'partners' => sanitize_localized_list_map($payload['partners'] ?? [], 12, 140),
            'updatedAt' => normalize_date($payload['updatedAt'] ?? gmdate('Y-m-d')),
        ],
    ];
}

function normalize_news_payload(array $payload, array $list, ?array $currentNews): array
{
    $title = sanitize_localized_text_map($payload['title'] ?? [], 180);
    $excerpt = sanitize_localized_text_map($payload['excerpt'] ?? [], 320);
    $content = sanitize_localized_list_map($payload['content'] ?? [], 12, 700);

    if (!has_localized_value($title) || !has_localized_value($excerpt)) {
        return ['valid' => false, 'message' => 'News title and excerpt are required.'];
    }

    if (count($content['ar']) === 0 && count($content['zgh']) === 0 && count($content['en']) === 0) {
        return ['valid' => false, 'message' => 'News content is required.'];
    }

    $slugInput = create_slug_from_text((string) ($payload['slug'] ?? ''));
    $slugFallback = $title['en'] !== '' ? $title['en'] : ($title['ar'] !== '' ? $title['ar'] : 'news');
    $slug = resolve_unique_slug(
        $list,
        $slugInput,
        $slugFallback,
        $currentNews !== null ? (int) ($currentNews['id'] ?? 0) : null
    );

    return [
        'valid' => true,
        'data' => [
            'slug' => $slug,
            'title' => $title,
            'excerpt' => $excerpt,
            'content' => $content,
            'keyPoints' => sanitize_localized_list_map($payload['keyPoints'] ?? [], 8, 120),
            'author' => sanitize_localized_text_map($payload['author'] ?? [], 140),
            'publishedAt' => normalize_date($payload['publishedAt'] ?? gmdate('Y-m-d')),
        ],
    ];
}

function normalize_page_payload(array $payload, array $list, ?array $currentPage): array
{
    $title = sanitize_localized_text_map($payload['title'] ?? [], 180);
    $excerpt = sanitize_localized_text_map($payload['excerpt'] ?? [], 320);
    $content = sanitize_localized_list_map($payload['content'] ?? [], 20, 700);

    if (!has_localized_value($title) || !has_localized_value($excerpt)) {
        return ['valid' => false, 'message' => 'Page title and excerpt are required.'];
    }

    if (count($content['ar']) === 0 && count($content['zgh']) === 0 && count($content['en']) === 0) {
        return ['valid' => false, 'message' => 'Page content is required.'];
    }

    $slugInput = create_slug_from_text((string) ($payload['slug'] ?? ''));
    $slugFallback = $title['en'] !== '' ? $title['en'] : ($title['ar'] !== '' ? $title['ar'] : 'page');
    $slug = resolve_unique_slug(
        $list,
        $slugInput,
        $slugFallback,
        $currentPage !== null ? (int) ($currentPage['id'] ?? 0) : null
    );

    $status = strtolower(normalize_text($payload['status'] ?? 'published'));
    if (!in_array($status, ['draft', 'published'], true)) {
        $status = 'published';
    }

    return [
        'valid' => true,
        'data' => [
            'slug' => $slug,
            'title' => $title,
            'excerpt' => $excerpt,
            'content' => $content,
            'status' => $status,
            'publishedAt' => normalize_date($payload['publishedAt'] ?? gmdate('Y-m-d')),
            'updatedAt' => normalize_date($payload['updatedAt'] ?? gmdate('Y-m-d')),
        ],
    ];
}

function normalize_media_payload(array $payload, array $list, ?array $currentMedia): array
{
    $title = sanitize_localized_text_map($payload['title'] ?? [], 180);
    if (!has_localized_value($title)) {
        return ['valid' => false, 'message' => 'Media title is required.'];
    }

    $type = strtolower(normalize_text($payload['type'] ?? ''));
    if (!in_array($type, ['image', 'video', 'document', 'audio'], true)) {
        return ['valid' => false, 'message' => 'Media type is invalid.'];
    }

    $url = sanitize_url($payload['url'] ?? '');
    if ($url === '') {
        return ['valid' => false, 'message' => 'A valid media URL is required.'];
    }

    $slugInput = create_slug_from_text((string) ($payload['slug'] ?? ''));
    $slugFallback = $title['en'] !== '' ? $title['en'] : ($title['ar'] !== '' ? $title['ar'] : 'media');
    $slug = resolve_unique_slug(
        $list,
        $slugInput,
        $slugFallback,
        $currentMedia !== null ? (int) ($currentMedia['id'] ?? 0) : null
    );

    return [
        'valid' => true,
        'data' => [
            'slug' => $slug,
            'type' => $type,
            'title' => $title,
            'description' => sanitize_localized_text_map($payload['description'] ?? [], 280),
            'url' => $url,
            'thumbnail' => sanitize_url($payload['thumbnail'] ?? '') ?: $url,
            'createdAt' => (string) ($currentMedia['createdAt'] ?? gmdate('c')),
        ],
    ];
}

function sanitize_settings_update(array $currentSettings, array $payload): array
{
    $next = clone_settings($currentSettings);

    if (is_array($payload['hero'] ?? null)) {
        $next['hero']['title'] = sanitize_localized_text_map($payload['hero']['title'] ?? [], 180);
        $next['hero']['text'] = sanitize_localized_text_map($payload['hero']['text'] ?? [], 500);
        $next['hero']['badge'] = sanitize_localized_text_map($payload['hero']['badge'] ?? [], 120);
    }

    if (is_array($payload['contact'] ?? null)) {
        $next['contact']['email'] = substr(normalize_text($payload['contact']['email'] ?? ''), 0, 180);
        $next['contact']['phone'] = substr(normalize_text($payload['contact']['phone'] ?? ''), 0, 80);
        $next['contact']['address'] = sanitize_localized_text_map($payload['contact']['address'] ?? [], 260);
    }

    if (is_array($payload['social'] ?? null)) {
        $next['social']['facebook'] = sanitize_url($payload['social']['facebook'] ?? '');
        $next['social']['instagram'] = sanitize_url($payload['social']['instagram'] ?? '');
        $next['social']['linkedin'] = sanitize_url($payload['social']['linkedin'] ?? '');
        $next['social']['youtube'] = sanitize_url($payload['social']['youtube'] ?? '');
    }

    if (is_array($payload['donation'] ?? null)) {
        $next['donation']['beneficiary'] = substr(normalize_text($payload['donation']['beneficiary'] ?? ''), 0, 140);
        $next['donation']['iban'] = substr(normalize_text($payload['donation']['iban'] ?? ''), 0, 90);
        $next['donation']['bic'] = substr(normalize_text($payload['donation']['bic'] ?? ''), 0, 60);
    }

    if (is_array($payload['legal'] ?? null)) {
        $next['legal']['updatedAt'] = normalize_date($payload['legal']['updatedAt'] ?? gmdate('Y-m-d'));
        $next['legal']['registrationNumber'] = substr(normalize_text($payload['legal']['registrationNumber'] ?? ''), 0, 90);
        $next['legal']['taxReference'] = substr(normalize_text($payload['legal']['taxReference'] ?? ''), 0, 90);
    }

    return $next;
}

function clone_settings(array $settings): array
{
    return [
        'hero' => [
            'title' => sanitize_localized_text_map($settings['hero']['title'] ?? [], 180),
            'text' => sanitize_localized_text_map($settings['hero']['text'] ?? [], 500),
            'badge' => sanitize_localized_text_map($settings['hero']['badge'] ?? [], 120),
        ],
        'contact' => [
            'email' => substr(normalize_text($settings['contact']['email'] ?? ''), 0, 180),
            'phone' => substr(normalize_text($settings['contact']['phone'] ?? ''), 0, 80),
            'address' => sanitize_localized_text_map($settings['contact']['address'] ?? [], 260),
        ],
        'social' => [
            'facebook' => sanitize_url($settings['social']['facebook'] ?? ''),
            'instagram' => sanitize_url($settings['social']['instagram'] ?? ''),
            'linkedin' => sanitize_url($settings['social']['linkedin'] ?? ''),
            'youtube' => sanitize_url($settings['social']['youtube'] ?? ''),
        ],
        'donation' => [
            'beneficiary' => substr(normalize_text($settings['donation']['beneficiary'] ?? ''), 0, 140),
            'iban' => substr(normalize_text($settings['donation']['iban'] ?? ''), 0, 90),
            'bic' => substr(normalize_text($settings['donation']['bic'] ?? ''), 0, 60),
        ],
        'legal' => [
            'updatedAt' => normalize_date($settings['legal']['updatedAt'] ?? gmdate('Y-m-d')),
            'registrationNumber' => substr(normalize_text($settings['legal']['registrationNumber'] ?? ''), 0, 90),
            'taxReference' => substr(normalize_text($settings['legal']['taxReference'] ?? ''), 0, 90),
        ],
    ];
}

function validate_contact_payload(array $payload, array $config): array
{
    $errors = [];
    $lang = normalize_lang($payload['lang'] ?? 'ar');

    $name = normalize_text($payload['name'] ?? '');
    $email = strtolower(normalize_text($payload['email'] ?? ''));
    $subject = normalize_text($payload['subject'] ?? '');
    $message = normalize_text($payload['message'] ?? '');
    $website = normalize_text($payload['website'] ?? '');
    $company = normalize_text($payload['company'] ?? '');
    $nickname = normalize_text($payload['nickname'] ?? '');

    if ($name === '' || text_length($name) < 2) {
        $errors['name'] = 'Name is required (2+ chars).';
    }
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Valid email is required.';
    }
    if ($subject === '' || text_length($subject) < 4) {
        $errors['subject'] = 'Subject is required (4+ chars).';
    }
    if ($message === '' || text_length($message) < 20) {
        $errors['message'] = 'Message is required (20+ chars).';
    }
    if ($website !== '' || $company !== '' || $nickname !== '') {
        $errors['bot'] = 'Suspicious submission.';
    }

    $timingErrors = validate_form_timing($payload, $config);
    foreach ($timingErrors as $key => $value) {
        $errors[$key] = $value;
    }

    if (count($errors) > 0) {
        return ['valid' => false, 'errors' => $errors];
    }

    return [
        'valid' => true,
        'data' => [
            'name' => $name,
            'email' => $email,
            'subject' => $subject,
            'message' => $message,
            'lang' => $lang,
        ],
        'errors' => [],
    ];
}

function validate_newsletter_payload(array $payload, array $config): array
{
    $errors = [];
    $lang = normalize_lang($payload['lang'] ?? 'ar');
    $email = strtolower(normalize_text($payload['email'] ?? ''));
    $company = normalize_text($payload['company'] ?? '');

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Valid email is required.';
    }
    if ($company !== '') {
        $errors['bot'] = 'Suspicious submission.';
    }

    $timingErrors = validate_form_timing($payload, $config);
    foreach ($timingErrors as $key => $value) {
        $errors[$key] = $value;
    }

    if (count($errors) > 0) {
        return ['valid' => false, 'errors' => $errors];
    }

    return [
        'valid' => true,
        'data' => [
            'email' => $email,
            'lang' => $lang,
        ],
        'errors' => [],
    ];
}

function validate_form_timing(array $payload, array $config): array
{
    $errors = [];
    $startedAt = isset($payload['formStartedAt']) ? (int) $payload['formStartedAt'] : 0;
    if ($startedAt <= 0) {
        return $errors;
    }

    $nowMs = (int) round(microtime(true) * 1000);
    $age = $nowMs - $startedAt;

    if ($age < (int) $config['min_form_fill_ms']) {
        $errors['formStartedAt'] = 'Form submitted too quickly.';
    } elseif ($age > (int) $config['max_form_age_ms']) {
        $errors['formStartedAt'] = 'Form session expired.';
    }

    return $errors;
}

function contains_blocked_object_keys($value, int $depth = 0): bool
{
    if (!is_array($value)) {
        return false;
    }

    if ($depth > 12) {
        return true;
    }

    $blocked = ['__proto__', 'prototype', 'constructor'];
    foreach ($value as $key => $item) {
        if (in_array((string) $key, $blocked, true)) {
            return true;
        }
        if (is_array($item) && contains_blocked_object_keys($item, $depth + 1)) {
            return true;
        }
    }

    return false;
}

function normalize_lang($value): string
{
    $lang = strtolower(trim((string) $value));
    return in_array($lang, ['ar', 'zgh', 'en'], true) ? $lang : 'ar';
}

function normalize_text($value): string
{
    $text = trim((string) $value);
    $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text);
    return $text === null ? '' : $text;
}

function text_length(string $value): int
{
    return function_exists('mb_strlen') ? (int) mb_strlen($value) : strlen($value);
}

function text_substr(string $value, int $start, int $length): string
{
    return function_exists('mb_substr') ? (string) mb_substr($value, $start, $length) : substr($value, $start, $length);
}

function sanitize_url($value): string
{
    $url = normalize_text($value);
    if ($url === '') {
        return '';
    }

    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return '';
    }

    $parts = parse_url($url);
    if (!is_array($parts)) {
        return '';
    }

    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    if ($scheme !== 'http' && $scheme !== 'https') {
        return '';
    }

    return $url;
}

function sanitize_localized_text_map($value, int $maxLength = 240): array
{
    $source = is_array($value) ? $value : [];
    return [
        'ar' => text_substr(normalize_text($source['ar'] ?? ''), 0, $maxLength),
        'zgh' => text_substr(normalize_text($source['zgh'] ?? ''), 0, $maxLength),
        'en' => text_substr(normalize_text($source['en'] ?? ''), 0, $maxLength),
    ];
}

function sanitize_list($value, int $maxItems = 10, int $maxLength = 220): array
{
    $items = [];

    if (is_array($value)) {
        $items = $value;
    } elseif (is_string($value)) {
        $items = preg_split('/\r\n|\r|\n/', $value) ?: [];
    }

    $clean = [];
    foreach ($items as $item) {
        $text = text_substr(normalize_text($item), 0, $maxLength);
        if ($text !== '') {
            $clean[] = $text;
        }
        if (count($clean) >= $maxItems) {
            break;
        }
    }

    return $clean;
}

function sanitize_localized_list_map($value, int $maxItems = 10, int $maxLength = 220): array
{
    $source = is_array($value) ? $value : [];
    return [
        'ar' => sanitize_list($source['ar'] ?? [], $maxItems, $maxLength),
        'zgh' => sanitize_list($source['zgh'] ?? [], $maxItems, $maxLength),
        'en' => sanitize_list($source['en'] ?? [], $maxItems, $maxLength),
    ];
}

function has_localized_value(array $map): bool
{
    foreach (['ar', 'zgh', 'en'] as $key) {
        if (normalize_text($map[$key] ?? '') !== '') {
            return true;
        }
    }
    return false;
}

function create_slug_from_text(string $value): string
{
    $cleaned = strtolower(normalize_text($value));
    $cleaned = preg_replace('/[^a-z0-9\s-]/', '', $cleaned) ?? '';
    $cleaned = preg_replace('/\s+/', '-', $cleaned) ?? '';
    $cleaned = preg_replace('/-+/', '-', $cleaned) ?? '';
    $cleaned = trim($cleaned, '-');
    return substr($cleaned, 0, 80);
}

function resolve_unique_slug(array $list, string $requestedSlug, string $fallbackText, ?int $currentId): string
{
    $fallbackSlug = create_slug_from_text($fallbackText);
    if ($fallbackSlug === '') {
        $fallbackSlug = 'entry-' . time();
    }

    $base = is_valid_slug($requestedSlug) ? $requestedSlug : $fallbackSlug;
    $candidate = $base;
    $suffix = 2;

    while (slug_exists($list, $candidate, $currentId)) {
        $candidate = $base . '-' . $suffix;
        $suffix++;
    }

    return $candidate;
}

function slug_exists(array $list, string $slug, ?int $currentId): bool
{
    foreach ($list as $entry) {
        if (!is_array($entry)) {
            continue;
        }

        $entrySlug = (string) ($entry['slug'] ?? '');
        $entryId = isset($entry['id']) ? (int) $entry['id'] : null;
        if ($entrySlug !== $slug) {
            continue;
        }

        if ($currentId === null || $entryId !== $currentId) {
            return true;
        }
    }

    return false;
}

function is_valid_slug(string $slug): bool
{
    return preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) === 1;
}

function infer_next_id(array $list): int
{
    $max = 0;
    foreach ($list as $item) {
        if (is_array($item) && isset($item['id'])) {
            $max = max($max, (int) $item['id']);
        }
    }
    return $max + 1;
}

function find_index_by_id(array $list, int $id): int
{
    foreach ($list as $index => $item) {
        if ((int) ($item['id'] ?? 0) === $id) {
            return (int) $index;
        }
    }
    return -1;
}

function trim_records(array &$list, int $max): void
{
    while (count($list) > $max) {
        array_shift($list);
    }
}

function pick_localized(array $map, string $lang): string
{
    $selected = $map[$lang] ?? ($map['ar'] ?? ($map['zgh'] ?? ($map['en'] ?? '')));
    return normalize_text($selected);
}

function pick_localized_list(array $map, string $lang): array
{
    $selected = $map[$lang] ?? ($map['ar'] ?? ($map['zgh'] ?? ($map['en'] ?? [])));
    if (!is_array($selected)) {
        return [];
    }

    $clean = [];
    foreach ($selected as $item) {
        $text = normalize_text($item);
        if ($text !== '') {
            $clean[] = $text;
        }
    }

    return $clean;
}

function normalize_date($value): string
{
    $timestamp = strtotime((string) $value);
    if ($timestamp === false) {
        return gmdate('Y-m-d');
    }

    return gmdate('Y-m-d', $timestamp);
}

function format_public_date(string $value, string $lang): string
{
    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return $value;
    }

    if (class_exists('IntlDateFormatter')) {
        $locale = $lang === 'en' ? 'en_US' : 'ar_MA';
        $formatter = new IntlDateFormatter($locale, IntlDateFormatter::LONG, IntlDateFormatter::NONE, 'UTC');
        $formatted = $formatter->format($timestamp);
        if (is_string($formatted) && $formatted !== '') {
            return $formatted;
        }
    }

    return gmdate('Y-m-d', $timestamp);
}

function text_by_lang(string $lang, string $ar, string $zgh, string $en): string
{
    if ($lang === 'en') {
        return $en;
    }
    if ($lang === 'zgh') {
        return $zgh !== '' ? $zgh : $ar;
    }
    return $ar;
}

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
