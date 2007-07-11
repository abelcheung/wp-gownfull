<?
// WP plugin should be either 2 or 3 dirs deep from WP top dir
if (file_exists ('../../../wp-config.php'))
	require_once ('../../../wp-config.php');
elseif (file_exists ('../../wp-config.php'))
	require_once ('../../wp-config.php');
 
$CFG->GownFull_URL = get_option ('home') . '/' . PLUGINDIR . '/' . dirname (plugin_basename (__FILE__)) . '/';

$CFG->Installed_IM = array(
'greek' => array('displayname' => 'Greek', 'objname' => 'GreekInputMethod'),
'cheque' => array('displayname' => 'Cheque Amount', 'objname' => 'ChequeInputMethod'),
'mimetex' => array('displayname' => 'mimeTeX', 'objname' => 'mimeTeXInputMethod'),
'quick' => array('displayname' => '\u901f\u6210', 'objname' => 'QuickInputMethod'),
'cangjie3' => array('displayname' => '\u5009\u9821', 'objname' => 'CangJie3InputMethod'),
'zhuyin' => array('displayname' => '\u6ce8\u97f3', 'objname' => 'ZhuYinInputMethod'),
'pinyin' => array('displayname' => '\u62fc\u97f3', 'objname' => 'PinyinInputMethod')
);
?>
