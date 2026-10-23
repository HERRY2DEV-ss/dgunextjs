<?php
// Fresh CMS content for the Glance page; uses the site's existing PDO.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Apikey, X-Requested-With');
header('Cache-Control: no-store');
ini_set('display_errors', '0');
ob_start();

function glance_send($status, $data, $message) {
    if (ob_get_length()) ob_clean();
    $json = json_encode(array('error' => $status < 400 ? '0' : '1', 'message' => $message, 'data' => $data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        error_log('DGU Glance API: JSON encoding failed.');
        $status = 500;
        $json = '{"error":"1","message":"Response encoding failed.","data":[]}';
    }
    http_response_code($status);
    echo $json;
    exit;
}


try {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') glance_send(405, array(), 'Use POST.');
    $key = isset($_SERVER['HTTP_APIKEY']) ? trim($_SERVER['HTTP_APIKEY']) : '';
    if (!$key && function_exists('getallheaders')) foreach (getallheaders() as $name => $value) if (strtolower($name) === 'apikey') $key = trim($value);
    $expected = getenv('DGU_API_KEY') ?: 'e33af7151e5cce3e14fff44c544e3c9fb9e0bece8a8d3ede63df4598012153e1';
    if (!$key || !hash_equals($expected, $key)) glance_send(401, array(), 'Invalid API key.');
    $raw = trim(file_get_contents('php://input'));
    if ($raw !== '') {
        $input = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($input) || substr($raw, 0, 1) !== '{') glance_send(400, array(), 'Invalid JSON body.');
        if (array_key_exists('URL', $input) && (!is_string($input['URL']) || trim($input['URL']) !== 'dgu-at-glance')) glance_send(400, array(), 'URL must be dgu-at-glance.');
    }
    require __DIR__ . '/../includes/classes.php';
    if (!isset($dbh) || !($dbh instanceof PDO)) throw new RuntimeException('PDO unavailable.');
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $statement = $dbh->prepare("SELECT sno, page_heading, friendly_url, detail, details_second, details_third, additionalDetails, additionalDetails2, meta_title, meta_desc FROM link_page WHERE friendly_url = :slug AND status IN ('active', '1') AND websitetype = 'english' ORDER BY sno");
    $statement->execute(array(':slug' => 'dgu-at-glance'));
    $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
    if (!$rows) glance_send(404, array(), 'Glance information was not found.');
    if (count($rows) > 1) error_log('DGU Glance API: ambiguous page slug; preserving first record in sno order.');
    $row = $rows[0]; $parts = array();
    foreach (array('detail', 'details_second', 'details_third', 'additionalDetails', 'additionalDetails2') as $field) if (trim((string) $row[$field]) !== '') $parts[] = $row[$field];
    if (!$parts) glance_send(404, array(), 'Glance content is unavailable.');
    $page = array('id' => $row['sno'], 'title' => $row['page_heading'], 'url' => $row['friendly_url'], 'html' => implode("\n", $parts), 'metaTitle' => $row['meta_title'], 'metaDescription' => $row['meta_desc']);

    // The PDF banner shows a video, but the CMS has no hero video. Configure the real URL if supplied.
    glance_send(200, array('page' => $page, 'videoUrl' => getenv('DGU_GLANCE_VIDEO_URL') ?: ''), 'Glance content found.');
} catch (Throwable $error) {
    error_log('DGU Glance API: ' . get_class($error) . ', code ' . $error->getCode() . ', line ' . $error->getLine());
    glance_send(500, array(), 'Glance information is temporarily unavailable.');
}
