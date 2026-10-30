<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
ini_set('display_errors', '0');

function homepage_sliders_reply($status, $message) {
    http_response_code($status);
    echo json_encode(array('error' => '1', 'message' => $message, 'data' => array()), JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    homepage_sliders_reply(405, 'Use POST.');
}

$apiKey = trim((string) getenv('DGU_SLIDERS_API_KEY'));
if ($apiKey === '') {
    error_log('Homepage sliders proxy: DGU_SLIDERS_API_KEY is not configured.');
    homepage_sliders_reply(503, 'Homepage sliders are temporarily unavailable.');
}

if (!function_exists('curl_init')) {
    error_log('Homepage sliders proxy: the PHP cURL extension is unavailable.');
    homepage_sliders_reply(503, 'Homepage sliders are temporarily unavailable.');
}

$handle = curl_init('https://dgu.ac.in/api/get-sliders.php');
curl_setopt_array($handle, array(
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => '{}',
    CURLOPT_HTTPHEADER => array(
        'Accept: application/json',
        'Content-Type: application/json',
        'Apikey: ' . $apiKey,
    ),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 25,
));
$body = curl_exec($handle);
$status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
$curlError = curl_errno($handle);
curl_close($handle);

if ($body === false || $curlError !== 0) {
    error_log('Homepage sliders proxy: upstream request failed (cURL ' . $curlError . ').');
    homepage_sliders_reply(502, 'Homepage sliders are temporarily unavailable.');
}

$payload = json_decode($body, true);
if ($status < 200 || $status >= 300 || !is_array($payload) || !isset($payload['error']) ||
    (string) $payload['error'] !== '0' || !isset($payload['data']) || !is_array($payload['data'])) {
    error_log('Homepage sliders proxy: upstream returned an unsuccessful or invalid response (HTTP ' . $status . ').');
    homepage_sliders_reply(502, 'Homepage sliders are temporarily unavailable.');
}

http_response_code(200);
echo $body;
