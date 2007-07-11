<?php

/*
Plugin Name: WP-GownFull
Plugin URI: http://me.abelcheung.org/gownfull/
Description: An integration of <a href="http://code.google.com/p/gownfull/">GownFull</a> web input method with WordPress.
Author: Abel Cheung 
Author URI: http://me.abelcheung.org/
Version: 0.1

Copyright (c) 2007  Abel Cheung  (email : abelcheung AT gmail DOT com)

All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may be
      used to endorse or promote products derived from this software without
      specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

// Retrieve the list of installed input methods;
require_once (dirname (__FILE__) . '/config.php');

function wp_gownfull_first_run ()
{
	global $CFG;

	if (false === get_option ('gownfull_enabled_im'))
		add_option ('gownfull_enabled_im', array_keys ($CFG->Installed_IM));
}

function wp_gownfull_action ()
{
?>
	<script type='text/javascript' src="<?php global $CFG; echo $CFG->GownFull_URL; ?>/include_gownfull.php"></script>
	<noscript><small><?php _e('(JavaScript support is turned off. GownFull input method engine will not be available.)'); ?></small></noscript>
<?php
}

function wp_gownfull_update_options ()
{
	$error = FALSE;

	if (!is_array ($_POST['wp_gownfull_enabled_ims']))
		$error = TRUE;
	else
	{
		foreach ($_POST['wp_gownfull_enabled_ims'] as $im)
			if (!is_string ($im) || !preg_match ('/^\w+$/', $im)) {
				$error = TRUE;
				break;
			}
	}

	if ($error)
		echo '<div id="message" class="updated error"><p>' . __('Configuration form contains invalid value. Please submit correct configuration.') . '</p></div>';
	else
	{
		update_option ('gownfull_enabled_im', $_POST['wp_gownfull_enabled_ims']);
		echo '<div id="message" class="updated fade"><p>' . __('Options saved.') . '</p></div>';
	}
}

function wp_gownfull_config_form ()
{
	global $CFG;

	if ( isset($_POST['Submit']) && isset($_POST['wp_gownfull_enabled_ims']) )
	{
		// echo '<pre>'; var_dump ($_POST['wp_gownfull']); echo "</pre>\n";
		wp_gownfull_update_options ();
	}
?>

	<div class="wrap">
	<form method="post" action="" id="wp-gownfull-config-form">
	<h2><?php _e('GownFull options') ?></h2>

	<p class="submit">
	<input type="submit" name="Submit" value="<?php _e('Update Options &raquo;') ?>" />
	</p>

	<fieldset class="options">
		<legend><?php _e('Enabled input methods') ?></legend>
<?php
	$enabled_im = get_option ('gownfull_enabled_im');
	foreach ($CFG->Installed_IM as $im_id => $im_data)
	{
		echo "\t\t<input type='checkbox' ";
		if (in_array ($im_id, (array) $enabled_im)) echo 'checked="checked" '; 
		echo "name='wp_gownfull_enabled_ims[]' value='{$im_id}'> ";
		// print_r ($im_data); echo "<br />\n"; 
		echo preg_replace ('/\\\\u([0-9a-fA-F]{1,4})/', '&#x$1;', $im_data['displayname']) . "<br />\n";
	}
?>
	</fieldset>

	<p class="submit">
	<input type="submit" name="Submit" value="<?php _e('Update Options &raquo;') ?>" />
	</p>

	</div>
	</form>
<?php
}

function wp_gownfull_admin ()
{
	add_options_page (__('WP-gownfull options'),
	                  'WP-gownfull', 9, __FILE__,
	                  'wp_gownfull_config_form');
}

add_action ('activate_gownfull/wp-gownfull.php', 'wp_gownfull_first_run');
add_action ('admin_menu', 'wp_gownfull_admin');
add_action ('comment_form', 'wp_gownfull_action');

?>
