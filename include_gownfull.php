<?
if(!$CFG) require_once('config.php');

header('Content-Type: application/x-javascript');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: no-cache');

if(key_exists('debug',$_GET) && $_GET['debug']) {
	readfile($CFG->GownFull_javascript_debug_file);
	$debug = true;
}
else {
	readfile($CFG->GownFull_javascript_file);
	$debug = false;
}

// change the config
printf("GownFullConfig.gownfull_base_url = '%s';\r\n",$CFG->GownFull_URL);
printf("GownFullConfig.css_file = '%s';\r\n",$CFG->GownFull_URL . 'gownfull.css');
printf("GownFullConfig.getim_url = '%s';\r\n",$CFG->GownFull_URL . 'getim.php');

if(key_exists('nocreate',$_GET) && $_GET['nocreate']) {
}
else {
	printf("new GownFull(new GenericGownFullBuilder);\r\n");

	// install modifiers
	//printf("%s.modifiers.push(new RingBufferOutputModifier(%s,1000));\r\n",$CFG->GownFull_InstanceName,$CFG->GownFull_InstanceName);
	//printf("%s.modifiers.push(new TimerOutputModifier(%s));\r\n",$CFG->GownFull_InstanceName,$CFG->GownFull_InstanceName);
	if($debug) printf("GownFull.instance.modifiers.push(new UnicodeImageOutputModifier(GownFull.instance));\r\n");
	
	if(!$_GET['noregdownload']) {
		foreach($CFG->Available_IM as $im) {
			printf("GownFull.instance.RegisterDownload('%s',\"%s\");\r\n",$im['objname'],$im['displayname']);
		}
	}
}
?>
