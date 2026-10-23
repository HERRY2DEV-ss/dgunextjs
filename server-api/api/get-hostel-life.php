<?php
// Hostel Life: fresh, read-only CMS content. Reuses the site's existing PDO connection.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Apikey, X-Requested-With');
header('Cache-Control: no-store');
ini_set('display_errors', '0');
ob_start();

function hostel_send($status, $data, $message) {
    if (ob_get_length()) ob_clean();
    $json = json_encode(array('error' => $status < 400 ? '0' : '1', 'message' => $message, 'data' => $data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        error_log('DGU Hostel API: JSON encoding failed.');
        $status = 500;
        $json = '{"error":"1","message":"Response encoding failed.","data":[]}';
    }
    http_response_code($status);
    echo $json;
    exit;
}
function hostel_url($value, $folder = '') {
    $value = trim((string) $value);
    if ($value === '') return '';
    if (strpos($value, '//') === 0) $value = 'https:' . $value;
    if (preg_match('~^https?://~i', $value)) {
        $parts = parse_url($value);
        return $parts && !isset($parts['user']) && !isset($parts['pass']) ? $value : '';
    }
    if (preg_match('~^[a-z][a-z0-9+.-]*:~i', $value)) return '';
    $base = defined('API_DOMAINURL') ? rtrim(API_DOMAINURL, '/') : 'https://dgu.ac.in';
    $path = implode('/', array_map(function ($part) { return rawurlencode(rawurldecode($part)); }, explode('/', $value)));
    return $base . ($folder && strpos($value, '/') === false ? '/uploads/images/' . $folder . '/' : '/') . ltrim($path, '/');
}
function hostel_video_url($source) {
    if (preg_match('~\bsrc\s*=\s*[\'"]([^\'"]+)~i', $source, $match)) $source = html_entity_decode($match[1], ENT_QUOTES, 'UTF-8');
    return hostel_url($source);
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') hostel_send(405, array(), 'Use POST.');
    $key = isset($_SERVER['HTTP_APIKEY']) ? trim($_SERVER['HTTP_APIKEY']) : '';
    if (!$key && function_exists('getallheaders')) foreach (getallheaders() as $name => $value) if (strtolower($name) === 'apikey') $key = trim($value);
    $expected = getenv('DGU_API_KEY') ?: 'e33af7151e5cce3e14fff44c544e3c9fb9e0bece8a8d3ede63df4598012153e1';
    if (!$key || !hash_equals($expected, $key)) hostel_send(401, array(), 'Invalid API key.');
    $raw = trim(file_get_contents('php://input'));
    if ($raw !== '') {
        $input = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($input) || substr($raw, 0, 1) !== '{') hostel_send(400, array(), 'Invalid JSON body.');
        if (array_key_exists('URL', $input) && (!is_string($input['URL']) || trim($input['URL']) !== 'hostel-life')) hostel_send(400, array(), 'URL must be hostel-life.');
    }
    require __DIR__ . '/../includes/classes.php';
    if (!isset($dbh) || !($dbh instanceof PDO)) throw new RuntimeException('PDO unavailable.');
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $statement = $dbh->prepare("SELECT sno, page_heading, friendly_url, detail, details_second, details_third, additionalDetails, additionalDetails2, meta_title, meta_desc FROM link_page WHERE friendly_url IN (:life, :types) AND status IN ('active', '1') AND websitetype = 'english' ORDER BY sno");
    $statement->execute(array(':life' => 'hostel-life', ':types' => 'hostel-types'));
    $pages = array();
    foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $slug = $row['friendly_url'];
        if (isset($pages[$slug])) { error_log('DGU Hostel API: ambiguous page slug ' . $slug . '; preserving first record in sno order.'); continue; }
        $parts = array();
        foreach (array('detail', 'details_second', 'details_third', 'additionalDetails', 'additionalDetails2') as $field) if (trim((string) $row[$field]) !== '') $parts[] = $row[$field];
        $pages[$slug] = array('id' => $row['sno'], 'title' => $row['page_heading'], 'url' => $slug, 'html' => implode("\n", $parts), 'metaTitle' => $row['meta_title'], 'metaDescription' => $row['meta_desc']);
    }
    if (!$pages) hostel_send(404, array(), 'Hostel information was not found.');

    // These are the existing published hostel-photo and campus-video catalogues.
    $statement = $dbh->prepare("SELECT p.childid, p.subcate, p.description, p.image, p.iframeCode, c.friendly_url FROM photo_subcate p INNER JOIN photo_cate c ON c.parentid = p.parentid WHERE c.friendly_url IN (:photos, :videos) AND c.status IN ('active', '1') AND p.status IN ('active', '1') ORDER BY c.sorder, c.parentid, p.sorder, p.childid");
    $statement->execute(array(':photos' => 'hostel-life-gallery', ':videos' => 'video-gallery'));
    $photos = array(); $videos = array();
    foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
        if ($row['friendly_url'] === 'hostel-life-gallery') {
            $photos[] = array('id' => $row['childid'], 'title' => $row['subcate'], 'description' => $row['description'], 'imageURL' => hostel_url($row['image'], 'subcate'));
        } else {
            $videos[] = array('id' => $row['childid'], 'title' => $row['subcate'], 'description' => $row['description'], 'url' => hostel_video_url($row['iframeCode']));
        }
    }
    $tour = hostel_url(getenv('DGU_HOSTEL_TOUR_URL') ?: '');
    if (!$tour && isset($pages['hostel-life']) && preg_match('~<(?:iframe|video)\b[^>]*\bsrc\s*=\s*[\'"]([^\'"]+)~i', $pages['hostel-life']['html'], $match)) $tour = hostel_url(html_entity_decode($match[1], ENT_QUOTES, 'UTF-8'));
    hostel_send(200, array('page' => isset($pages['hostel-life']) ? $pages['hostel-life'] : null, 'residencesPage' => isset($pages['hostel-types']) ? $pages['hostel-types'] : null, 'photos' => $photos, 'videos' => $videos, 'tourUrl' => $tour), 'Hostel content found.');
} catch (Throwable $error) {
    error_log('DGU Hostel API: ' . get_class($error) . ', code ' . $error->getCode() . ', line ' . $error->getLine());
    hostel_send(500, array(), 'Hostel information is temporarily unavailable.');
}
