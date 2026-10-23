<?php
// Read-only endpoints for the existing DGU database. No database updates.
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
function dgu_program_id($value) {
    if ($value === '') return 0;
    if ((!is_int($value) && !is_string($value)) || !preg_match('/^[1-9][0-9]*$/', (string) $value)) dgu_send(400, array(), 'Invalid PROGRAM_ID.');
    $digits = (string) $value; $maximum = (string) PHP_INT_MAX;
    if (strlen($digits) > strlen($maximum) || (strlen($digits) === strlen($maximum) && strcmp($digits, $maximum) > 0)) dgu_send(400, array(), 'Invalid PROGRAM_ID.');
    return (int) $digits;
}
function dgu_ids($value) {
    return array_values(array_unique(array_filter(array_map('intval', explode(',', (string) $value)), function ($id) { return $id > 0; })));
}
function dgu_media($value, $folder) {
    $value = trim((string) $value);
    if (!$value) return '';
    if (strpos($value, '//') === 0) return 'https:' . $value;
    if (preg_match('~^https?://~i', $value)) return $value;
    if (preg_match('~^[a-z][a-z0-9+.-]*:~i', $value)) return '';
    $base = defined('API_DOMAINURL') ? rtrim(API_DOMAINURL, '/') : 'https://dgu.ac.in';
    $parts = parse_url($value);
    if ($parts === false) return '';
    $path = isset($parts['path']) ? $parts['path'] : '';
    $encoded = implode('/', array_map(function ($part) { return rawurlencode(rawurldecode($part)); }, explode('/', $path)));
    $prefix = strpos($path, '/') !== false ? '/' : '/uploads/images/' . $folder . '/';
    return $base . $prefix . ltrim($encoded, '/') . (isset($parts['query']) ? '?' . $parts['query'] : '') . (isset($parts['fragment']) ? '#' . $parts['fragment'] : '');
}
function dgu_program_row($row) {
    $slug = dgu_slug($row['friendly_url']);
    if ($slug === '') error_log('DGU academic API: programme ' . (int) $row['sno'] . ' has no supported URL; retaining the record.');
    return array('id' => $row['sno'], 'programName' => $row['programName'], 'shortName' => $row['shortName'], 'url' => $slug, 'level' => $row['level'], 'isHome' => (int) $row['isHome']);
}
function dgu_students($db, $kind, $id, $offeredIds = array()) {
    $params = array(':kind' => $kind === 'program' ? 'course' : 'school', ':id' => $id);
    $relationship = 'placementType = :kind AND linkID = :id';
    if ($kind === 'school' && $offeredIds) {
        // School students include only its explicitly offered, published courses.
        // The school catalogue excludes specializations, so it cannot supply these IDs.
        $holders = array();
        foreach ($offeredIds as $index => $programId) {
            $key = ':studentProgram' . $index; $holders[] = $key; $params[$key] = $programId;
        }
        $relationship = '(' . $relationship . ') OR (placementType = \'course\' AND linkID IN (SELECT sno FROM masterPrograms WHERE status = 1 AND delete_status = 0 AND sno IN (' . implode(',', $holders) . ')))';
    }
    $rows = dgu_rows($db, 'SELECT sno, placementType, linkID, name, currentEmployer, designation, batch, description, alumniImage FROM masterPlacements WHERE status = 1 AND (' . $relationship . ') ORDER BY sno', $params);
    return array_map(function ($row) {
        // Verified against the original B.Com page's real, loading student photo.
        return array('id' => $row['sno'], 'name' => $row['name'], 'company' => $row['currentEmployer'], 'designation' => $row['designation'], 'batch' => $row['batch'], 'description' => $row['description'], 'imageURL' => dgu_media($row['alumniImage'], 'placement'), 'placementType' => $row['placementType'], 'linkID' => $row['linkID']);
    }, $rows);
}
function dgu_banners($db, $kind, $id) {
    $rows = dgu_rows($db, "SELECT sno, name, banner, mobileBanner, otherurl FROM sliders WHERE status = 'active' AND sliderType = :kind AND typeID = :id ORDER BY sorder, sno", array(':kind' => $kind === 'program' ? 'course' : 'school', ':id' => $id));
    return array_map(function ($row) { return array('id' => $row['sno'], 'name' => $row['name'], 'imageURL' => dgu_media($row['banner'], 'slides'), 'mobileImageURL' => dgu_media($row['mobileBanner'], 'slides'), 'url' => $row['otherurl']); }, $rows);
}
function dgu_linked_pages($db, $sources) {
    // A section's own anchor links establish the relationship; never infer a school.
    $slugs = array();
    $host = parse_url(defined('API_DOMAINURL') ? API_DOMAINURL : 'https://dgu.ac.in', PHP_URL_HOST);
    foreach ($sources as $html) {
        preg_match_all('~href\s*=\s*([\'"])(.*?)\1~is', (string) $html, $links, PREG_SET_ORDER);
        foreach ($links as $link) {
            $parts = parse_url(html_entity_decode($link[2], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            if ($parts === false || empty($parts['fragment']) || (isset($parts['host']) && !in_array(strtolower($parts['host']), array(strtolower((string) $host), 'dgu.ac.in', 'www.dgu.ac.in'), true))) continue;
            if (isset($parts['scheme']) && !in_array(strtolower($parts['scheme']), array('http', 'https'), true)) continue;
            $slug = dgu_slug(isset($parts['path']) ? $parts['path'] : '');
            if ($slug !== '') $slugs[$slug] = true;
        }
    }
    if (!$slugs) return array();
    $params = array(); $holders = array();
    foreach (array_keys($slugs) as $index => $slug) { $key = ':linked' . $index; $holders[] = $key; $params[$key] = $slug; }
    $rows = dgu_rows($db, "SELECT sno, page_heading, friendly_url, detail, details_second, details_third, additionalDetails, additionalDetails2 FROM link_page WHERE friendly_url IN (" . implode(',', $holders) . ") AND status IN ('active', '1') AND websitetype = 'english' ORDER BY sno", $params);
    $pages = array();
    foreach ($rows as $row) {
        if (isset($pages[$row['friendly_url']])) { error_log('DGU academic API: ambiguous linked page; preserving the first published record.'); continue; }
        $content = array();
        foreach (array('detail', 'details_second', 'details_third', 'additionalDetails', 'additionalDetails2') as $field) if (trim((string) $row[$field]) !== '') $content[] = $row[$field];
        $pages[$row['friendly_url']] = array('id' => $row['sno'], 'title' => $row['page_heading'], 'url' => $row['friendly_url'], 'html' => implode("\n", $content));
    }
    return array_values($pages);
}
function dgu_published_program_page($db, $slug) {
    // The current public URL may be a CMS page rather than a masterPrograms body.
    // Match only its exact published slug; do not borrow another program's data.
    $rows = dgu_rows($db, "SELECT sno, page_heading, friendly_url, detail, details_second, details_third, additionalDetails, additionalDetails2 FROM link_page WHERE friendly_url = :url AND status IN ('active', '1') AND websitetype = 'english' ORDER BY sno", array(':url' => $slug));
    if (!$rows) return null;
    if (count($rows) > 1) error_log('DGU academic API: ambiguous published program page; preserving the first published record.');
    $row = $rows[0]; $content = array();
    foreach (array('detail', 'details_second', 'details_third', 'additionalDetails', 'additionalDetails2') as $field) if (trim((string) $row[$field]) !== '') $content[] = $row[$field];
    return array('id' => $row['sno'], 'title' => $row['page_heading'], 'url' => $row['friendly_url'], 'html' => implode("\n", $content));
}
function dgu_program_columns($summary = false) {
    $columns = 'sno, programName, shortName, friendly_url, level, isHome, parentProgram, status, delete_status, sortingOrder';
    return $summary ? $columns : $columns . ', searchArea, duration, shortDescription, programDetails, areaHeading, areaDetails, areaHeading3, areaDetails3, introText, eligibility, accordion, feeStructure, scholarship, eligibilityCriteria1, eligibilityCriteria2, eligibilityIntroduction, eligibilityTerms, registrationLink, prospectusurl, researchFacility, overview, banner, featureImage, meta_title, meta_desc';
}
function dgu_catalog($db, $schoolUrl = '', $home = false, $schools = null) {
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
    $programs = $schoolUrl && !$holders ? array() : dgu_rows($db, 'SELECT ' . dgu_program_columns(true) . ', searchArea FROM masterPrograms WHERE status = 1 AND delete_status = 0 AND searchArea = 1' . ($schoolUrl ? ' AND sno IN (' . implode(',', $holders) . ')' : '') . ' ORDER BY sortingOrder, sno', $params);
    // Append in database order, never in the programsOffered CSV order.
    foreach ($programs as $program) {
        $id = (int) $program['sno'];
        if (!isset($offeredBy[$id])) continue;
        $item = dgu_program_row($program);
        foreach ($offeredBy[$id] as $index) $members[$index][] = $item;
    }
    $levels = dgu_rows($db, 'SELECT sno, name, status, sorder FROM masterLevel WHERE status = 1 ORDER BY sorder, sno');
    $knownLevels = array(); foreach ($levels as $level) $knownLevels[(int) $level['sno']] = true;
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
        $result[] = array('id' => $school['sno'], 'schoolName' => $school['schoolName'], 'url' => $school['friendly_url'], 'level' => $groups, 'childMenu' => $home ? $members[$index] : $groups);
    }
    return $result;
}
function dgu_faqs($db, $type, $id) {
    $rows = dgu_rows($db, 'SELECT name, description FROM masterFaq WHERE faqType = :type AND typeID = :id AND status = 1 ORDER BY sortingOrder, sno', array(':type' => $type, ':id' => $id));
    return array_map(function ($row) { return array('question' => $row['name'], 'answer' => $row['description']); }, $rows);
}
function dgu_program_info($db, $slug, $programId = 0) {
    $params = array(':url' => $slug);
    if ($programId) $params[':id'] = $programId;
    $rows = dgu_rows($db, 'SELECT ' . dgu_program_columns() . ' FROM masterPrograms WHERE friendly_url = :url AND status = 1 AND delete_status = 0' . ($programId ? ' AND sno = :id' : '') . ' ORDER BY sortingOrder, sno', $params);
    if (!$rows) {
        $candidates = dgu_rows($db, 'SELECT sno, friendly_url FROM masterPrograms WHERE status = 1 AND delete_status = 0' . ($programId ? ' AND sno = :id' : '') . ' ORDER BY sortingOrder, sno', $programId ? array(':id' => $programId) : array());
        foreach ($candidates as $candidate) if (dgu_slug($candidate['friendly_url']) === $slug) {
            $rows = dgu_rows($db, 'SELECT ' . dgu_program_columns() . ' FROM masterPrograms WHERE sno = :id AND status = 1 AND delete_status = 0 ORDER BY sortingOrder, sno', array(':id' => $candidate['sno']));
            break;
        }
    }
    if (!$rows) dgu_send(404, array(), 'Program not found.');
    $row = $rows[0]; $id = $row['sno'];
    $children = array_map('dgu_program_row', dgu_rows($db, 'SELECT ' . dgu_program_columns(true) . ' FROM masterPrograms WHERE parentProgram = :id AND status = 1 AND delete_status = 0 ORDER BY sortingOrder, sno', array(':id' => $id)));
    $tabs = array();
    foreach (dgu_rows($db, 'SELECT sno, programID, heading, description, showPrograms, status, sortingOrder FROM masterProgramTab WHERE programID = :id AND status = 1 ORDER BY sortingOrder, sno', array(':id' => $id)) as $tab) {
        $related = (int) $tab['showPrograms'] ? $children : array();
        $tabs[] = array('id' => $tab['sno'], 'tabName' => $tab['heading'], 'tabDetails' => $tab['description'], 'tabPrograms' => $related);
    }
    $accordions = array(); $ids = dgu_ids($row['accordion']);
    if ($ids) {
        $params = array(); $holders = array();
        foreach ($ids as $index => $value) { $key = ':id' . $index; $holders[] = $key; $params[$key] = $value; }
        foreach (dgu_rows($db, 'SELECT sno, name, description, status, sortingOrder FROM masterAccordion WHERE status = 1 AND sno IN (' . implode(',', $holders) . ') ORDER BY sortingOrder, sno', $params) as $item) $accordions[] = array('id' => $item['sno'], 'accordionName' => $item['name'], 'accordionDetails' => $item['description']);
    }
    $record = array('id' => $id, 'url' => $slug, 'programName' => $row['programName'], 'shortName' => $row['shortName'], 'duration' => $row['duration'], 'bannerImage' => dgu_media($row['banner'], 'programs'), 'mobileBannerImage' => dgu_media($row['featureImage'], 'programs'),
        'introText' => $row['introText'], 'shortDescription' => $row['shortDescription'], 'programDetails' => $row['programDetails'], 'eligibility' => $row['eligibility'], 'feeStructure' => $row['feeStructure'], 'scholarship' => $row['scholarship'],
        'eligibilityIntroduction' => $row['eligibilityIntroduction'], 'eligibilityCriteria1' => $row['eligibilityCriteria1'], 'eligibilityCriteria2' => $row['eligibilityCriteria2'], 'eligibilityTerms' => $row['eligibilityTerms'],
        'programMoreInfoHeading' => $row['areaHeading'], 'programMoreInfo' => $row['areaDetails'], 'programOtherInfoHeading' => $row['areaHeading3'], 'programOtherInfo' => $row['areaDetails3'],
        'researchFacility' => $row['researchFacility'], 'overview' => $row['overview'], 'registrationLink' => $row['registrationLink'], 'prospectusURL' => $row['prospectusurl'],
        'meta_title' => $row['meta_title'], 'meta_desc' => $row['meta_desc'], 'tabs' => $tabs, 'accordion' => $accordions, 'faqs' => dgu_faqs($db, 'course', $id), 'students' => dgu_students($db, 'program', $id), 'banners' => dgu_banners($db, 'program', $id));
    $record['relatedPrograms'] = $children;
    $record['publishedPage'] = dgu_published_program_page($db, $slug);
    $record['linkedPages'] = dgu_linked_pages($db, array($row['programDetails'], $row['areaDetails'], $row['areaDetails3'], $row['researchFacility']));
    $record['otherPrograms'] = (int) $row['parentProgram'] > 0 ? array_map('dgu_program_row', dgu_rows($db, 'SELECT ' . dgu_program_columns(true) . ' FROM masterPrograms WHERE parentProgram = :parent AND sno <> :id AND status = 1 AND delete_status = 0 ORDER BY sortingOrder, sno', array(':parent' => $row['parentProgram'], ':id' => $id))) : array();
    foreach (array('programHighlight' => 'highlights', 'programOutcome' => 'outcomes', 'programPlacement' => 'placements', 'programRecruiters' => 'recruiters') as $table => $key) {
        $columns = $key === 'recruiters' ? 'imageFile' : ($key === 'placements' ? 'counterName, symbol, details, iconImage' : 'heading, details, iconImage');
        $items = dgu_rows($db, 'SELECT sno, programID, status, delete_status, ' . $columns . ' FROM ' . $table . ' WHERE programID = :id AND status = 1 AND delete_status = 0 ORDER BY sno', array(':id' => $id));
        $record[$key] = array_map(function ($item) use ($key) {
            if ($key === 'recruiters') return array('id' => $item['sno'], 'imageURL' => dgu_media($item['imageFile'], 'recruiters'));
            return array('id' => $item['sno'], 'title' => isset($item['heading']) ? $item['heading'] : $item['counterName'], 'description' => $item['details'], 'symbol' => isset($item['symbol']) ? $item['symbol'] : '', 'imageURL' => dgu_media($item['iconImage'], 'programs'));
        }, $items);
    }
    $schools = dgu_rows($db, 'SELECT sno, friendly_url, schoolName, programsOffered, faculty, status, delete_status, sorder FROM masterSchool WHERE status = 1 AND delete_status = 0 ORDER BY sorder, sno');
    $schoolByProgram = array();
    foreach ($schools as $index => $school) foreach (dgu_ids($school['programsOffered']) as $memberId) if (!isset($schoolByProgram[$memberId])) $schoolByProgram[$memberId] = $index;
    $record['facultyIds'] = array();
    // Prefer this programme's explicit school over an inherited parent mapping.
    foreach (array((int) $id, (int) $row['parentProgram']) as $memberId) {
        if (!$memberId) continue;
        if (isset($schoolByProgram[$memberId])) {
            $school = $schools[$schoolByProgram[$memberId]];
            $record['schoolUrl'] = $school['friendly_url']; $record['schoolName'] = $school['schoolName'];
            $record['facultyIds'] = dgu_ids($school['faculty']);
            break;
        }
    }
    return $record;
}
function dgu_school_info($db, $slug) {
    $rows = dgu_rows($db, 'SELECT sno, schoolName, friendly_url, programsOffered, faculty, banner, details, shortDescription, areaHeading2, areaDetails2, areaHeading3, areaDetails3, moreHeading, moresubHeading, readmore, academicPage, highestCTC, avgSalary, meta_title, meta_desc, status, delete_status, sorder FROM masterSchool WHERE friendly_url = :url AND status = 1 AND delete_status = 0 ORDER BY sorder, sno', array(':url' => $slug));
    if (!$rows) dgu_send(404, array(), 'School not found.');
    $row = $rows[0]; $id = $row['sno']; $programs = dgu_catalog($db, $slug, false, $rows);
    $placementProgramIds = dgu_ids($row['programsOffered']);
    return array('id' => $id, 'url' => $slug, 'schoolUrl' => $slug, 'schoolName' => $row['schoolName'], 'facultyIds' => dgu_ids($row['faculty']), 'placementProgramIds' => $placementProgramIds, 'bannerImage' => dgu_media($row['banner'], 'school'), 'students' => dgu_students($db, 'school', $id, $placementProgramIds), 'banners' => dgu_banners($db, 'school', $id),
        'details' => $row['details'], 'shortDescription' => $row['shortDescription'], 'areaHeading2' => $row['areaHeading2'], 'areaDetails2' => $row['areaDetails2'], 'areaHeading3' => $row['areaHeading3'], 'areaDetails3' => $row['areaDetails3'],
        'moreHeading' => $row['moreHeading'], 'moresubHeading' => $row['moresubHeading'], 'readmore' => $row['readmore'], 'academicPage' => $row['academicPage'],
        'highestCTC' => $row['highestCTC'], 'avgSalary' => $row['avgSalary'], 'meta_title' => $row['meta_title'], 'meta_desc' => $row['meta_desc'], 'programs' => $programs,
        'faqs' => dgu_faqs($db, 'school', $id), 'linkedPages' => dgu_linked_pages($db, array($row['details'], $row['areaDetails2'], $row['areaDetails3'], $row['readmore'])), 'placements' => dgu_rows($db, 'SELECT placementHeading, placementDetails, placedCounter, ctcCounter, offerCounter, shortHeading, shortDesc, placementUrl FROM schoolPlacement WHERE schoolID = :id AND status = 1 ORDER BY sno', array(':id' => $id)));
}
function dgu_footer($db) {
    // Select only public settings; credentials/SMS settings never enter an API response.
    $settings = dgu_rows($db, "SELECT website_name, phone, mobile, email_id, address, address2, footer_note, facebook, twitter, instagram, youtube, linkedin, whatsapp FROM settings WHERE websitetype = 'english' ORDER BY sno LIMIT 1");
    $rows = dgu_rows($db, "SELECT sno, name, otherurl, target, section FROM bottom_menu WHERE status = 'active' AND websitetype = 'english' ORDER BY section, position, sno");
    $groups = array();
    $labels = array('section1' => 'Quick Links', 'section2' => 'Schools', 'section3' => 'Resources');
    foreach ($rows as $row) {
        $section = $row['section'];
        if (!isset($groups[$section])) $groups[$section] = array('id' => $section, 'name' => isset($labels[$section]) ? $labels[$section] : $section, 'childMenu' => array());
        $groups[$section]['childMenu'][] = array('id' => $row['sno'], 'name' => trim($row['name']), 'url' => trim($row['otherurl']), 'target' => $row['target'] === '_blank' ? '_blank' : '_self');
    }
    $data = array_values($groups);
    if ($settings) {
        $row = $settings[0]; $social = array();
        foreach (array('facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'whatsapp') as $network) if (trim($row[$network]) !== '') $social[] = array('name' => $network === 'twitter' ? 'X' : ucfirst($network), 'url' => trim($row[$network]));
        $plain = function ($value) { return trim(html_entity_decode(strip_tags(preg_replace('~<(?:br\\s*/?|/p)>~i', "\n", (string) $value)), ENT_QUOTES | ENT_HTML5, 'UTF-8')); };
        $data[] = array('id' => 'contact', 'info' => array(array('campusAddress' => $plain($row['address']), 'cityAddress' => $plain($row['address2']), 'mobileNo' => trim($row['mobile']) ?: trim($row['phone']), 'emailID' => trim($row['email_id']))), 'websiteName' => $plain($row['website_name']), 'copyright' => $plain($row['footer_note']), 'social' => $social);
    }
    return $data;
}
function dgu_dispatch($kind) {
    ob_start();
    try {
        $input = dgu_input();
        if ($kind === 'footer') dgu_send(200, dgu_footer(dgu_db()), 'Footer information found');
        if ($kind === 'programs') {
            $schoolValue = dgu_scalar($input, 'SCHOOL_URL');
            $school = dgu_slug($schoolValue);
            if ($schoolValue !== '' && !$school) dgu_send(400, array(), 'Invalid SCHOOL_URL.');
            $home = dgu_scalar($input, 'IS_HOME', 0);
            $data = dgu_catalog(dgu_db(), $school, !empty($home));
            if ($school && !$data) dgu_send(404, array(), 'School not found.');
            $levelCount = 0; $programCount = 0;
            foreach ($data as $schoolRow) foreach ($schoolRow['level'] as $levelRow) { $levelCount++; $programCount += count($levelRow['programs']); }
            dgu_reply(200, array('error' => '0', 'school' => count($data), 'level' => $levelCount, 'programs' => $programCount, 'message' => 'Records Found', 'data' => $data));
        }
        $parameter = $kind === 'school' ? 'SCHOOL_URL' : 'PROGRAM_URL';
        $slug = dgu_slug(dgu_scalar($input, $parameter));
        if (!$slug) dgu_send(400, array(), $parameter . ' is required.');
        $programId = dgu_program_id(dgu_scalar($input, 'PROGRAM_ID'));
        $db = dgu_db();
        $record = $kind === 'school' ? dgu_school_info($db, $slug) : dgu_program_info($db, $slug, $programId);
        dgu_send(200, array($record), '1 record found');
    } catch (Throwable $error) {
        error_log('DGU academic API (' . $kind . '): ' . get_class($error) . ', code ' . $error->getCode() . ', line ' . $error->getLine());
        dgu_send(500, array(), 'Content is temporarily unavailable.');
    }
}
