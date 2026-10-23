<?php
declare(strict_types=1);
ini_set('display_errors', '0');
ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Apikey, X-Requested-With');
header('Cache-Control: no-store');

function differentiators_reply(int $status, array $payload): void {
    if (ob_get_length()) ob_clean();
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        error_log('DGU differentiators API: response encoding failed (' . json_last_error() . ').');
        $status = 500;
        $json = '{"error":"1","message":"Response encoding failed.","data":null}';
    }
    http_response_code($status);
    echo $json;
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'POST') {
    header('Allow: POST, OPTIONS');
    differentiators_reply(405, ['error' => '1', 'message' => 'Use POST.', 'data' => null]);
}
$expectedKey = (string)(getenv('DGU_DIFFERENTIATORS_API_KEY') ?: getenv('DGU_API_KEY') ?: 'e33af7151e5cce3e14fff44c544e3c9fb9e0bece8a8d3ede63df4598012153e1');
$receivedKey = trim((string)($_SERVER['HTTP_APIKEY'] ?? ''));
if ($receivedKey === '' && function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if (strcasecmp($name, 'Apikey') === 0) { $receivedKey = trim((string)$value); break; }
    }
}
if ($receivedKey === '' || !hash_equals($expectedKey, $receivedKey)) {
    differentiators_reply(401, ['error' => '1', 'message' => 'Not a valid request.', 'data' => null]);
}
$body = trim((string)file_get_contents('php://input'));
if ($body !== '') {
    $input = json_decode($body);
    if (json_last_error() !== JSON_ERROR_NONE || !is_object($input)) {
        differentiators_reply(400, ['error' => '1', 'message' => 'Send a JSON object.', 'data' => null]);
    }
}

function differentiators_text($value): string {
    $html = preg_replace('/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/i', '', (string)($value ?? ''));
    $html = preg_replace('/<br\b[^>]*>|<\/(?:p|div|li|h[1-6])\s*>/i', ' ', (string)$html);
    $text = html_entity_decode(strip_tags((string)$html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim((string)preg_replace('/[\s\x{00A0}]+/u', ' ', $text));
}

function differentiators_url($value, string $domain): string {
    $raw = trim(html_entity_decode((string)($value ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    if ($raw === '' || preg_match('/^(javascript|data|vbscript):/i', $raw)) return '';
    if (strpos($raw, '//') === 0) $raw = 'https:' . $raw;
    elseif (!preg_match('/^[a-z][a-z0-9+.-]*:/i', $raw)) $raw = rtrim($domain, '/') . '/' . ltrim($raw, '/');
    $url = parse_url($raw);
    if (!$url || !in_array(strtolower($url['scheme'] ?? ''), ['https', 'http'], true)
        || empty($url['host']) || isset($url['user']) || isset($url['pass']) || !filter_var($raw, FILTER_VALIDATE_URL)) return '';
    return $raw;
}

try {
    // Use the university's existing connection; no new database credentials are needed.
    require_once __DIR__ . '/../includes/classes.php';
    if (!isset($dbh) || !($dbh instanceof PDO)) throw new RuntimeException('PDO connection unavailable.');
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $columns = ['sno', 'middleLeftHeading', 'middleSubBlockHeading'];
    for ($index = 1; $index <= 6; $index++) {
        foreach (['Heading', 'Details', 'url'] as $suffix) $columns[] = 'block' . $index . $suffix;
    }
    // This singleton has an empty legacy status field in the supplied DB.
    // Read its actual record, rather than imposing an unrelated status=1 filter.
    $query = $dbh->prepare('SELECT ' . implode(', ', $columns) . ' FROM welcome WHERE sno = :id LIMIT 1');
    $query->execute(['id' => 1]);
    $row = $query->fetch(PDO::FETCH_ASSOC);
    if (!$row) differentiators_reply(404, ['error' => '1', 'message' => 'No content available.', 'data' => null]);
    $domain = defined('API_DOMAINURL') ? (string)constant('API_DOMAINURL') : 'https://dgu.ac.in';
    $points = [];
    for ($index = 1; $index <= 6; $index++) {
        $title = differentiators_text($row['block' . $index . 'Heading']);
        $description = differentiators_text($row['block' . $index . 'Details']);
        $url = differentiators_url($row['block' . $index . 'url'], $domain);
        if ($title === '' && $description === '') continue;
        $points[] = ['id' => $index, 'title' => $title,
            'description' => $description, 'url' => $url];
    }
    $title = trim(differentiators_text($row['middleLeftHeading']) . ' ' . differentiators_text($row['middleSubBlockHeading']));
    if ($title === '' && !$points) differentiators_reply(404, ['error' => '1', 'message' => 'No section title available.', 'data' => null]);
    differentiators_reply(200, ['error' => '0', 'message' => count($points) . ' Records Found', 'data' => ['title' => $title, 'points' => $points]]);
} catch (Throwable $error) {
    error_log('DGU differentiators API: ' . get_class($error) . ', code ' . $error->getCode() . ', line ' . $error->getLine());
    differentiators_reply(500, ['error' => '1', 'message' => 'Information is temporarily unavailable.', 'data' => null]);
}
