<?
if(!$CFG) require_once('config.php');

header('Content-Type: application/x-javascript');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Last-Modified: '.gmdate('D, d M Y H:i:s').' GMT');
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: no-cache');

if(!key_exists('objname',$_GET)) return;
if(!key_exists('download_callback_id',$_GET)) return;

$file = $CFG->GownFull_IMPath.$_GET['objname'].".js";

if(file_exists($file)) {
	if(key_exists('component',$_GET)) {
		$fp = fopen($file,'r');
		$inside = false;
		$found = false;
		while(!feof($fp)) {
			$line = fgets($fp);
			if(ereg('//BEGIN_COMPONENT{(.*)}',$line,$regs)) {
				if($regs[1] === $_GET['component']) {
					$inside = true;
					printf("var _tmpdata = {\n");
				}
				continue;
			}
			if($inside) {
				if(ereg('//END_COMPONENT',$line)) {
					$inside = false;
					$found = true;
					printf("dummy: null\n");
					printf("}\n");
					continue;
				}
				echo($line);
			}
		}
		fclose($fp);
		if($found) printf("DownloadManager.ServerCallback(%d,_tmpdata);\n",$_GET['download_callback_id'],$_GET['objname']);
		else printf("DownloadManager.ServerCallback(%d,null);\n",$_GET['download_callback_id']);
	}
	else {
		$fp = fopen($file,'r');
		$components = array();
		$inside = false;
		while(!feof($fp)) {
			$line = fgets($fp);
			if(ereg('//BEGIN_COMPONENT{(.*)}',$line,$regs)) {
				$components[] = $regs[1];
				$inside = true;
				continue;
			}
			if(ereg('//END_COMPONENT',$line)) {
				$inside = false;
				continue;
			}
			if(ereg('//BEGIN_COMPONENT_SOURCE',$line)) {
				// send all urls of component
				for($i=0;$i<count($components);$i++) {
					printf("'%s': '%s?objname=%s&component=%s'",$components[$i],$CFG->GownFull_BASE.$_SERVER["PHP_SELF"],$_GET['objname'],$components[$i]);
					if($i < count($components)-1) printf(",\n");
					else printf("\n");
				}
				continue;
			}
			if(ereg('//END_COMPONENT_SOURCE',$line)) {
				continue;
			}
			if(!$inside) echo($line);
		}
		fclose($fp);
		printf("DownloadManager.ServerCallback(%d,new %s());\n",$_GET['download_callback_id'],$_GET['objname']);
	}
}
else {
	printf("DownloadManager.ServerCallback(%d,null);\n",$_GET['download_callback_id']);
}
?>
