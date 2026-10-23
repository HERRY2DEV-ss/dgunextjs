<?php
// Standalone school/programme catalogue. Upload only this file to api/get-programs.php.
// Uses the existing includes/classes.php connection; SELECT queries only.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Apikey, X-Requested-With');
header('Cache-Control: no-store');
ini_set('display_errors', '0');

function dgu_reply($status, $payload) {
    if (ob_get_length()) ob_clean();
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        error_log('DGU academic API: response encoding failed (' . json_last_error() . ').');
        $status = 500;
        $json = '{"error":"1","message":"Response encoding failed.","data":[]}';
    }
    http_response_code($status);
    echo $json;
    exit;
}

function dgu_send($status, $data, $message = '') {
    dgu_reply($status, array('error' => $status < 400 ? '0' : '1', 'message' => $message, 'data' => $data));
}

function dgu_input() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') dgu_send(405, array(), 'Use POST.');
    $supplied = isset($_SERVER['HTTP_APIKEY']) ? trim($_SERVER['HTTP_APIKEY']) : '';
    if (!$supplied && function_exists('getallheaders')) foreach (getallheaders() as $name => $value) if (strtolower($name) === 'apikey') $supplied = trim($value);
    $expected = getenv('DGU_API_KEY') ?: 'e33af7151e5cce3e14fff44c544e3c9fb9e0bece8a8d3ede63df4598012153e1';
    if (!$supplied || !hash_equals($expected, $supplied)) dgu_send(401, array(), 'Invalid API key.');
    $raw = trim(file_get_contents('php://input'));
    $input = $raw === '' ? array() : json_decode($raw, true);
    if (!is_array($input) || ($raw !== '' && (json_last_error() !== JSON_ERROR_NONE || substr($raw, 0, 1) !== '{'))) dgu_send(400, array(), 'Invalid JSON object.');
    return $input;
}

function dgu_db() {
    require __DIR__ . '/../includes/classes.php';
    if (!isset($dbh) || !($dbh instanceof PDO)) throw new RuntimeException('Existing database connection is unavailable.');
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $dbh;
}

function dgu_rows($db, $sql, $params = array()) {
    $statement = $db->prepare($sql);
    $statement->execute($params);
    return $statement->fetchAll(PDO::FETCH_ASSOC);
}

function dgu_slug($value) {
    if (!is_string($value)) return '';
    $value = trim($value);
    if (strpos($value, '//') === 0) $value = 'https:' . $value;
    $parts = parse_url($value);
    if ($parts === false || (isset($parts['scheme']) && !in_array(strtolower($parts['scheme']), array('http', 'https'), true))) return '';
    $value = trim(rawurldecode(isset($parts['path']) ? $parts['path'] : ''), '/');
    return preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/i', $value) ? strtolower($value) : '';
}

function dgu_scalar($input, $name, $default = '') {
    if (!isset($input[$name])) return $default;
    if (!is_scalar($input[$name])) dgu_send(400, array(), 'Invalid ' . $name . '.');
    return $input[$name];
}

function dgu_ids($value) {
    return array_values(array_unique(array_filter(array_map('intval', explode(',', (string) $value)), function ($id) { return $id > 0; })));
}

function dgu_program_row($row) {
    $slug = dgu_slug($row['friendly_url']);
    if ($slug === '') error_log('DGU academic API: programme ' . (int) $row['sno'] . ' has no supported URL; retaining the record.');
    return array('id' => $row['sno'], 'programName' => $row['programName'], 'shortName' => $row['shortName'], 'url' => $slug, 'level' => $row['level'], 'isHome' => (int) $row['isHome']);
}

function dgu_catalog($db, $schoolUrl = '', $schools = null) {
    if ($schools === null) $schools = dgu_rows($db, 'SELECT sno, schoolName, friendly_url, programsOffered, status, delete_status, sorder FROM masterSchool WHERE status = 1 AND delete_status = 0' . ($schoolUrl ? ' AND friendly_url = :url' : '') . ' ORDER BY sorder, sno', $schoolUrl ? array(':url' => $schoolUrl) : array());
    $offeredBy = array(); $members = array();
    foreach ($schools as $index => $school) {
        $members[$index] = array();
        foreach (dgu_ids($school['programsOffered']) as $id) $offeredBy[$id][] = $index;
    }
    // Matches the recorded developer feed: search/list enabled programmes
    // explicitly offered by the school. Specializations remain in detail APIs.
    $params = array(); $holders = array();
    if ($schoolUrl) foreach (array_keys($offeredBy) as $index => $id) { $key = ':id' . $index; $params[$key] = $id; $holders[] = $key; }
    $programs = $schoolUrl && !$holders ? array() : dgu_rows($db, 'SELECT sno, programName, shortName, friendly_url, level, isHome, status, delete_status, searchArea, sortingOrder FROM masterPrograms WHERE status = 1 AND delete_status = 0 AND searchArea = 1' . ($schoolUrl ? ' AND sno IN (' . implode(',', $holders) . ')' : '') . ' ORDER BY sortingOrder, sno', $params);
    // Append in database order, never in the programsOffered CSV order.
    foreach ($programs as $program) {
        $id = (int) $program['sno'];
        if (!isset($offeredBy[$id])) continue;
        $item = dgu_program_row($program);
        foreach ($offeredBy[$id] as $index) $members[$index][] = $item;
    }
    $levels = dgu_rows($db, 'SELECT sno, name, status, sorder FROM masterLevel WHERE status = 1 ORDER BY sorder, sno');
    $knownLevels = array(); $levelNames = array();
    foreach ($levels as $level) { $knownLevels[(int) $level['sno']] = true; $levelNames[(int) $level['sno']] = $level['name']; }
    $result = array();
    foreach ($schools as $index => $school) {
        $byLevel = array(); $rest = array();
        foreach ($members[$index] as $item) {
            $levelId = (int) $item['level'];
            if (isset($knownLevels[$levelId])) $byLevel[$levelId][] = $item;
            else $rest[] = $item;
        }
        $groups = array();
        foreach ($levels as $level) {
            $levelId = (int) $level['sno'];
            if (isset($byLevel[$levelId])) $groups[] = array('id' => $level['sno'], 'levelName' => $level['name'], 'programs' => $byLevel[$levelId]);
        }
        if ($rest) $groups[] = array('id' => 0, 'levelName' => 'Programs', 'programs' => $rest);
        $flat = array();
        foreach ($members[$index] as $item) { $item['levelName'] = isset($levelNames[(int) $item['level']]) ? $levelNames[(int) $item['level']] : ''; $flat[] = $item; }
        $result[] = array('id' => $school['sno'], 'schoolName' => $school['schoolName'], 'url' => $school['friendly_url'], 'level' => $groups, 'childMenu' => $flat);
    }
    return $result;
}
// IS_HOME is accepted for compatibility with older clients. It never filters
// masterPrograms.isHome here: every school must return its listed programmes.
ob_start();
try {
    $input = dgu_input();
    $schoolValue = dgu_scalar($input, 'SCHOOL_URL');
    $school = dgu_slug($schoolValue);
    if ($schoolValue !== '' && !$school) dgu_send(400, array(), 'Invalid SCHOOL_URL.');
    dgu_scalar($input, 'IS_HOME', 0);
    $data = dgu_catalog(dgu_db(), $school);
    if ($school && !$data) dgu_send(404, array(), 'School not found.');
    $levelCount = 0; $programCount = 0;
    foreach ($data as $row) foreach ($row['level'] as $level) { $levelCount++; $programCount += count($level['programs']); }
    dgu_reply(200, array('error' => '0', 'school' => count($data), 'level' => $levelCount, 'programs' => $programCount, 'message' => 'Records Found', 'data' => $data));
} catch (Throwable $error) {
    error_log('DGU programmes API: ' . get_class($error) . ', code ' . $error->getCode() . ', line ' . $error->getLine());
    dgu_send(500, array(), 'Programmes are temporarily unavailable.');
}
