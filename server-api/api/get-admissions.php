<?php
// One read-only response for the existing Admissions design.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Apikey, X-Requested-With');
header('Cache-Control: no-store');
ini_set('display_errors', '0');
ob_start();
function admissions_send($status, $data, $message) {
    if (ob_get_length()) ob_clean();
    $json = json_encode(array('error' => $status < 400 ? '0' : '1', 'message' => $message, 'data' => $data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        error_log('DGU admissions API: response encoding failed (' . json_last_error() . ').');
        $status = 500;
        $json = '{"error":"1","message":"Response encoding failed.","data":[]}';
    }
    http_response_code($status);
    echo $json;
    exit;
}
function admissions_rows($db, $sql, $params = array()) {
    $statement = $db->prepare($sql); $statement->execute($params);
    return $statement->fetchAll(PDO::FETCH_ASSOC);
}
function admissions_html($value) {
    return trim(preg_replace('~<(script|style|head)\b[^>]*>.*?</\1\s*>|<!--.*?-->|<(?:link|meta)\b[^>]*>~is', '', (string) $value));
}
function admissions_url($value, $folder = '') {
    $value = trim((string) $value);
    if ($value === '') return '';
    if (strpos($value, '//') === 0) return 'https:' . $value;
    if (preg_match('~^https?://~i', $value)) return $value;
    if (preg_match('~^[a-z][a-z0-9+.-]*:~i', $value)) return '';
    $base = defined('API_DOMAINURL') ? rtrim(API_DOMAINURL, '/') : 'https://dgu.ac.in';
    $parts = parse_url($value);
    if ($parts === false) return '';
    $path = isset($parts['path']) ? $parts['path'] : '';
    $encoded = implode('/', array_map(function ($part) { return rawurlencode(rawurldecode($part)); }, explode('/', $path)));
    return $base . ($folder && strpos($path, '/') === false ? '/uploads/images/' . $folder . '/' : '/') . ltrim($encoded, '/') . (isset($parts['query']) ? '?' . $parts['query'] : '') . (isset($parts['fragment']) ? '#' . $parts['fragment'] : '');
}
function admissions_page($row) {
    if (!$row) return null;
    $content = array();
    foreach (array('detail', 'details_second', 'details_third', 'additionalDetails', 'additionalDetails2') as $key) {
        $html = admissions_html(isset($row[$key]) ? $row[$key] : '');
        if ($html !== '') $content[] = $html;
    }
    return array('id' => $row['sno'], 'title' => $row['page_heading'], 'html' => implode("\n", $content), 'url' => $row['friendly_url']);
}
function admissions_theme_asset($filename) {
    // Existing real theme assets; return a URL only if that file is present on the server.
    $path = rtrim(getenv('DGU_FRONTEND_BASE_PATH') ?: '', '/') . '/assets/' . $filename;
    return is_file(dirname(__DIR__) . $path) ? admissions_url($path) : '';
}
try {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') admissions_send(405, array(), 'Use POST.');
    $key = isset($_SERVER['HTTP_APIKEY']) ? trim($_SERVER['HTTP_APIKEY']) : '';
    if (!$key && function_exists('getallheaders')) foreach (getallheaders() as $name => $value) if (strtolower($name) === 'apikey') $key = trim($value);
    $expected = getenv('DGU_API_KEY') ?: 'e33af7151e5cce3e14fff44c544e3c9fb9e0bece8a8d3ede63df4598012153e1';
    if (!$key || !hash_equals($expected, $key)) admissions_send(401, array(), 'Invalid API key.');
    $raw = trim(file_get_contents('php://input'));
    if ($raw !== '') {
        $body = json_decode($raw, true);
        if (!is_array($body) || json_last_error() !== JSON_ERROR_NONE || substr($raw, 0, 1) !== '{') admissions_send(400, array(), 'Invalid JSON body.');
    }
    require __DIR__ . '/../includes/classes.php';
    if (!isset($dbh) || !($dbh instanceof PDO)) throw new RuntimeException('Existing PDO database connection is unavailable.');
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $slugs = array('admission-process', 'programs-fee-structures', 'education-loan', 'scholarships', 'hostel-types', 'refund-policy', 'international-student-admission', 'program-commencement-2026', 'program-commencement-date', 'placement-reports');
    $params = array(); $holders = array();
    foreach ($slugs as $index => $slug) { $parameter = ':slug' . $index; $params[$parameter] = $slug; $holders[] = $parameter; }
    $rows = admissions_rows($dbh, "SELECT sno, heading, page_heading, page_subheading, friendly_url, detail, details_second, details_third, additionalDetails, additionalDetails2, banner, image, banner_heading, banner_teaser_text, registrationLink, prospectus, meta_title, meta_desc FROM link_page WHERE friendly_url IN (" . implode(',', $holders) . ") AND status IN ('active', '1') ORDER BY sno", $params);
    $pages = array();
    foreach ($rows as $row) {
        $slug = $row['friendly_url'];
        if (isset($pages[$slug])) error_log('DGU admissions API: duplicate page slug; records ' . (int) $pages[$slug]['sno'] . ' and ' . (int) $row['sno'] . '. Preserving the existing last-in-sno-order selection.');
        $pages[$slug] = $row;
    }
    $process = isset($pages['admission-process']) ? $pages['admission-process'] : null;
    $fees = isset($pages['programs-fee-structures']) ? $pages['programs-fee-structures'] : null;
    $heading = admissions_rows($dbh, "SELECT name, description, details FROM heading WHERE LOWER(name) IN ('admission', 'admissions') AND status IN ('active', '1') ORDER BY sno");
    $resources = array();
    foreach (array('education-loan', 'scholarships', 'hostel-types') as $slug) if (isset($pages[$slug])) $resources[] = admissions_page($pages[$slug]);
    $commencement = isset($pages['program-commencement-2026']) ? $pages['program-commencement-2026'] : (isset($pages['program-commencement-date']) ? $pages['program-commencement-date'] : null);
    $international = isset($pages['international-student-admission']) ? admissions_page($pages['international-student-admission']) : null;
    $refund = isset($pages['refund-policy']) ? admissions_page($pages['refund-policy']) : null;
    $intro = $process && $process['page_subheading'] ? admissions_html($process['page_subheading']) : ($heading ? admissions_html($heading[0]['description'] . "\n" . $heading[0]['details']) : '');
    $banner = $process && $process['banner'] ? admissions_url($process['banner'], 'pages') : admissions_theme_asset('addmission_banner.webp');
    $media = array('src' => admissions_theme_asset('mba.mp4'), 'poster' => admissions_theme_asset('mba.webp'), 'stats' => array());
    $placement = isset($pages['placement-reports']) ? admissions_page($pages['placement-reports']) : null;
    $students = array();
    foreach (admissions_rows($dbh, "SELECT sno, name, currentEmployer, alumniImage FROM masterPlacements WHERE status = 1 ORDER BY sno DESC") as $student) $students[] = array('id' => $student['sno'], 'name' => $student['name'], 'company' => $student['currentEmployer'], 'imageURL' => admissions_url($student['alumniImage'], 'placement'));
    // No fabricated page record when only placement students exist.
    if (!$placement && $students) $placement = array('id' => null, 'title' => '', 'html' => '', 'url' => '');
    if ($placement) $placement['students'] = $students;
    $recruiters = array();
    foreach (admissions_rows($dbh, "SELECT sno, name, featureImage FROM masterRecruiters WHERE status = 1 ORDER BY sortingOrder, sno") as $recruiter) $recruiters[] = array('id' => $recruiter['sno'], 'name' => $recruiter['name'], 'imageURL' => admissions_url($recruiter['featureImage'], 'recruiters'));
    if (!$pages && !$heading && !$students && !$recruiters) admissions_send(404, array(), 'Admissions content was not found.');
    $viewBook = $process && $process['prospectus'] ? admissions_url($process['prospectus']) : '';
    if (!$viewBook && is_file(dirname(__DIR__) . '/uploads/documents/View-Book-2026.pdf')) $viewBook = admissions_url('/uploads/documents/View-Book-2026.pdf');
    $recruiterTitle = '';
    if ($placement && preg_match_all('~<h[1-6]\b[^>]*>(.*?)</h[1-6]>~is', $placement['html'], $matches)) foreach ($matches[1] as $label) {
        $text = trim(html_entity_decode(strip_tags($label), ENT_QUOTES, 'UTF-8'));
        if (stripos($text, 'recruiter') !== false) { $recruiterTitle = $text; break; }
    }
    $firstPage = $pages ? reset($pages) : null;
    $title = $heading ? $heading[0]['name'] : ($process ? $process['page_heading'] : ($fees ? $fees['page_heading'] : ($firstPage ? $firstPage['page_heading'] : '')));
    $data = array('page' => array('title' => $title, 'intro' => $intro, 'bannerImage' => $banner, 'metaTitle' => $process ? $process['meta_title'] : '', 'metaDescription' => $process ? $process['meta_desc'] : '', 'registrationLink' => $process ? admissions_url($process['registrationLink']) : ''),
        'process' => admissions_page($process), 'fees' => admissions_page($fees), 'resources' => $resources, 'international' => $international, 'refundPolicy' => $refund, 'viewBookUrl' => $viewBook,
        'commencement' => admissions_page($commencement), 'media' => $media, 'placements' => $placement, 'recruiters' => $recruiters, 'recruiterTitle' => $recruiterTitle);
    admissions_send(200, $data, 'Admissions content found.');
} catch (Throwable $error) {
    error_log('DGU admissions API: ' . get_class($error) . ', code ' . $error->getCode() . ', line ' . $error->getLine());
    admissions_send(500, array(), 'Admissions information is temporarily unavailable.');
}
