<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, X-Requested-With, Apikey");
$json = trim(file_get_contents('php://input'));
$configuredApiKey = getenv('DGU_PROGRAM_INFO_API_KEY');
if (!is_string($configuredApiKey) || trim($configuredApiKey) === '') {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array('Result' => 'Error', 'message' => 'Programme API is not configured.', 'data' => null));
    exit;
}
define('APIKEY', trim($configuredApiKey));

$headers = apache_request_headers();
//print_r($headers);
$json_decode = json_decode($json, true);
$postApiKey = preg_replace('/[^a-zA-Z0-9]/', '', trim($headers['Apikey']));
$programURL = trim( $json_decode['PROGRAM_URL'] );
if( $postApiKey !== "" && hash_equals(APIKEY, $postApiKey) )
{
    get_programs_info($programURL);
}
else
{
	echo json_encode(array('Result' => "Error", 'message' => "Error in getting info - Mismatch Token", "data" => "Not a Valid Request" ));
}

function get_programs_info($programURL)
{
	include "../includes/classes.php";
    if( $programURL != "" )
    {
        $programURL = preg_replace('/[^a-zA-Z0-9 \-]/', '', trim($programURL));
        $sql_query = "select * from masterPrograms where friendly_url = '$programURL'";
        $strQ = $dbh->prepare($sql_query);
        $strQ->execute();
        $schoolOutput = $output = $strQ->fetch(PDO::FETCH_BOTH);
        $programID = $output['sno'];
        
        $parentProgram = $output['parentProgram'];
        
        $sql_query="select * from masterLevel where sno='$output[level]'";
        $strQ=$dbh->prepare($sql_query);
        $strQ->execute();
        $level = $strQ->fetch(PDO::FETCH_ASSOC);
        
        // Match CSV identifiers exactly; LIKE '%2%' also matches 12, 20, 22...
        // A specialization can inherit the explicitly related parent school.
        $sql_query="select sno, schoolName, friendly_url, thumbImage as logo from masterSchool
            where status = 1 and (FIND_IN_SET(:programID, REPLACE(programsOffered, ' ', '')) > 0
                or FIND_IN_SET(:parentID, REPLACE(programsOffered, ' ', '')) > 0)
            order by CASE WHEN FIND_IN_SET(:programSort, REPLACE(programsOffered, ' ', '')) > 0 THEN 0 ELSE 1 END, sno limit 1";
        $strQ=$dbh->prepare($sql_query);
        $strQ->execute(array(':programID' => $programID, ':parentID' => (int) $parentProgram, ':programSort' => $programID));
        $schoolInfo = $strQ->fetch(PDO::FETCH_ASSOC);
        if (!$schoolInfo) $schoolInfo = array('sno' => '', 'schoolName' => '', 'friendly_url' => '');
        $schooID = $schoolInfo['sno'];
        
        $sql_query="select * from masterProgramTab where programID='$programID' order by sortingOrder";
        $strQ=$dbh->prepare($sql_query);
        $query_status=$strQ->execute();
        $tabInformation = $strQ->fetchAll();
        $count = 0;
        $tabArray = array();
        foreach( $tabInformation as $outputTabs )
        {
            $count++;
            $sql_query="select * from masterProgramTab where programID='$programID' and machineName = '$outputTabs[machineName]' order by sortingOrder";
            $strQ=$dbh->prepare($sql_query);
            $strQ->execute();
    	    $outputInfo = $strQ->fetch(PDO::FETCH_ASSOC);
    	    
    	    $strQ=$dbh->prepare( "select * from masterPrograms where parentProgram = '$programID' and status = 1 order by programName" );
            $strQ->execute();
            $dataOutput =$strQ->fetchAll();
            $count = 0;
            $programArray = array();
            if( $outputInfo['showPrograms'] == 1 ) 
            {
                foreach( $dataOutput as $programOutput )
                {
                    $programArray[] = array(
                    "id" => $programOutput['sno'],
                    "programName" => $programOutput['programName'],
                    "shortDescription" => $programOutput['shortDescription'],
                    "url" => $programOutput['friendly_url']
                    );        
                }
            }
            
            $tabArray[] = array(
                "id" => $outputInfo['sno'],
                "tabName" => strip_tags($outputInfo['heading']),
                "tabDetails" => $outputInfo['description'],
                "programs" => $programArray
            ); 
        }
        
        $specilizationProgram = array();
        $strQ=$dbh->prepare( "select * from masterPrograms where parentProgram = '$programID' and status = 1 order by sortingOrder asc" );
        $strQ->execute();
        $dataOutput =$strQ->fetchAll();
        foreach( $dataOutput as $outputPrograms )
        {
            $specilizationProgram[] = array(
                "id" => $outputPrograms['sno'],
                "programName" => $outputPrograms['programName'],
                "url" => $outputPrograms['friendly_url']
                );  
            
        }
        
        $prospectus = "";
        if( $schoolOutput['prospectusurl'] != "" )
        {
            $prospectus = $schoolOutput['prospectusurl'];
        }
        else if( $schoolOutput['prospectus'] != "" )
        {
            $prospectus = API_DOMAINURL."uploads/documents/prospectus/".$schoolOutput['prospectus'];
        }
        
        $strQ=$dbh->prepare( "select * from masterAccordion where sno IN($schoolOutput[accordion]) and status = 1 order by sortingOrder, name" );
        $strQ->execute();
        $dataOutput =$strQ->fetchAll();
        $count = 0;
        $accordion = array();
        foreach( $dataOutput as $outputAccordion )
        {
            $accordion[] = array(
                "id" => $outputAccordion['sno'],
                "name" => $outputAccordion['name'],
                "details" => $outputAccordion['description']
            ); 
        }
        
        $faq = array();
        $strQ=$dbh->prepare( "select * from masterFaq where faqType = 'course' and typeID = '$programID' and status = '1' order by sortingOrder" );
        $strQ->execute();
        $dataOutput =$strQ->fetchAll();
        foreach( $dataOutput as $childData )
        {
            $faq[] = array(
                "id" => $childData['sno'],
                "name" => $childData['name'],
                "details" => $childData['description']
            );
        }
        
        // Never substitute unrelated course/global records when this course is empty.
        $strQ=$dbh->prepare("select * from masterPlacements where placementType = 'course' and linkID = :programID and status = 1 order by sno, name");
        $strQ->execute(array(':programID' => $programID));
        $dataOutput = $strQ->fetchAll();
        $count = 0;
        $placementArray = array();
        foreach( $dataOutput as $outputPlacement )
        {
            $imageURL = "";
            if($outputPlacement['alumniImage']!='' && file_exists(__DIR__."/../uploads/images/placement/".$outputPlacement['alumniImage']))
            {
                $imageURL = API_DOMAINURL."uploads/images/placement/".$outputPlacement['alumniImage'];
            }
            
            $placementArray[] = array(
                "id" => $outputPlacement['sno'],
                "placementType" => $outputPlacement['placementType'],
                "linkID" => $outputPlacement['linkID'],
                "status" => $outputPlacement['status'],
                "name" => $outputPlacement['name'],
                "currentEmployer" => $outputPlacement['currentEmployer'],
                "details" => $outputPlacement['description'],
                "imageURL" => $imageURL
            );
            
        }

        $bannerQueryStatus = 'ready';
        try { $banners = dgu_update_banners($dbh, 'course', $programID); }
        catch (PDOException $exception) {
            // A slider schema/configuration error must not break the course content.
            error_log('DGU program banner query failed: ' . $exception->getMessage());
            $banners = array(); $bannerQueryStatus = 'error';
        }
        $data[] = array( 
            "id" => $output['sno'],
            "url" => $programURL,
            "schoolUrl" => $schoolInfo['friendly_url'],
            "schoolName" => $schoolInfo['schoolName'],
            "bannerImage" => dgu_update_media_url(isset($schoolOutput['banner']) ? $schoolOutput['banner'] : '', 'programs'),
            "mobileBannerImage" => dgu_update_media_url(isset($schoolOutput['featureImage']) ? $schoolOutput['featureImage'] : '', 'programs'),
            "banners" => $banners,
            "bannerQueryStatus" => $bannerQueryStatus,
            "students" => $placementArray,
            "placementScopeVerified" => true,
            "programName" => $output['programName'],
            "meta_title" => $output['meta_title'],
            "meta_desc" => $output['meta_desc'],
            "meta_keywords" => $output['meta_key'],
            "meta_canonical" => $output['meta_canonical'],
            "introText" => $output['introText'],
            "programDetails" => $output['programDetails'],
            "specialization" => $specilizationProgram,
            "programTabs" => $tabArray,
            "registrationLink" => $schoolOutput['registrationLink'],
            "prospectus" => $prospectus,
            "accordion" => $accordion,
            "placements" => $placementArray,
            "faq" => $faq,
            "areaHeading2" => $schoolOutput['areaHeading3'],
            "areaDetails2" => $schoolOutput['areaDetails3'],
            "areaHeading3" => $schoolOutput['areaHeading'],
            "areaDetails3" => $schoolOutput['areaDetails']
            
        );
    }
	
	$jsonData = $data;	
	if( count($data) > 0 )
	{
	    echo json_encode(array('error' => "0", 'message' => count($data)." Records Found", "data" => $jsonData ));
    }
    else
	    echo json_encode(array('Result' => "Error", 'message' => "Error in getting info - No Record(s) found", "data" => " No Record(s) found" ));
	
	
}

if(!function_exists('apache_request_headers')) {
    function apache_request_headers() {

        // Based on: http://www.iana.org/assignments/message-headers/message-headers.xml#perm-headers
        $arrCasedHeaders = array(
            // HTTP
            'Dasl'             => 'DASL',
            'Dav'              => 'DAV',
            'Etag'             => 'ETag',
            'Mime-Version'     => 'MIME-Version',
            'Slug'             => 'SLUG',
            'Te'               => 'TE',
            'Www-Authenticate' => 'WWW-Authenticate',
            // MIME
            'Content-Md5'      => 'Content-MD5',
            'Content-Id'       => 'Content-ID',
            'Content-Features' => 'Content-features',
        );
        $arrHttpHeaders = array();

        foreach($_SERVER as $strKey => $mixValue) {
            if('HTTP_' !== substr($strKey, 0, 5)) {
                continue;
            }

            $strHeaderKey = strtolower(substr($strKey, 5));

            if(0 < substr_count($strHeaderKey, '_')) {
                $arrHeaderKey = explode('_', $strHeaderKey);
                $arrHeaderKey = array_map('ucfirst', $arrHeaderKey);
                $strHeaderKey = implode('-', $arrHeaderKey);
            }
            else {
                $strHeaderKey = ucfirst($strHeaderKey);
            }

            if(array_key_exists($strHeaderKey, $arrCasedHeaders)) {
                $strHeaderKey = $arrCasedHeaders[$strHeaderKey];
            }

            $arrHttpHeaders[$strHeaderKey] = $mixValue;
        }

        return $arrHttpHeaders;

    }
}


function dgu_update_media_url($value, $folder) {
    $value = trim((string) $value);
    if ($value === '') return '';
    if (strpos($value, '//') === 0) return 'https:' . $value;
    if (preg_match('~^https?://~i', $value)) return $value;
    if (preg_match('~^[a-z][a-z0-9+.-]*:~i', $value)) return '';
    $base = rtrim(API_DOMAINURL, '/');
    $parts = parse_url($value);
    if ($parts === false) return '';
    $path = isset($parts['path']) ? $parts['path'] : '';
    $encoded = implode('/', array_map(function ($part) { return rawurlencode(rawurldecode($part)); }, explode('/', $path)));
    $prefix = strpos($path, '/') !== false ? '/' : '/uploads/images/' . $folder . '/';
    return $base . $prefix . ltrim($encoded, '/') . (isset($parts['query']) ? '?' . $parts['query'] : '');
}
function dgu_update_banners($dbh, $kind, $id) {
    // Schema already used by the supplied project's dgu-academic-common.php.
    $query = $dbh->prepare("SELECT sno, name, banner, mobileBanner, otherurl FROM sliders WHERE status = 'active' AND sliderType = :kind AND typeID = :id ORDER BY sorder, sno");
    $query->execute(array(':kind' => $kind, ':id' => $id));
    $banners = array();
    foreach ($query->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $desktop = dgu_update_media_url($row['banner'], 'slides');
        $mobile = dgu_update_media_url($row['mobileBanner'], 'slides');
        if ($desktop === '' && $mobile === '') continue;
        $banners[] = array('id' => $row['sno'], 'name' => $row['name'], 'imageURL' => $desktop, 'mobileImageURL' => $mobile, 'url' => $row['otherurl']);
    }
    return $banners;
}
?>