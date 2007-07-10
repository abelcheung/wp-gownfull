var mimeTeXInputMethod = InputMethod.extend({
	constructor: function()
	{
	},
	IMName: function()
	{
		return 'mimeTeX';
	},
	keydown_handler: function(obj,key,m)
	{
		var remap_key = {
			109: ['-',null],
			52: [null,'$'],
			49: [null,'!'],
			190: ['.',null],
			51: [null,'#'],
			222: ["'","\""],
			55: [null,'&'],
			53: [null,'%'],
			57: [null,'(']
		};

		if(key == 8) {
			if(this.ime.GetPreeditLength() > 0) {
				this.ime.DeletePreedit(1,1);
				return false;
			}
			else return true;
		}

		if(remap_key[key]) {
			var map = remap_key[key];
			var shiftp = (m & GownFull.KEY_SHIFT) ? true : false;

			if(map[1] && shiftp) this.ime.AppendPreedit(map[1],map[1]);
			else if(map[0] && !shiftp) this.ime.AppendPreedit(map[0],map[0]);
			else return true;

			return false;
		}
		return true;
	},
	keypress_handler: function(obj,key,m)
	{
/*
Release the following key:

Insert - 45
Home $ 36
PageUp ! 33
Delete . 46
End # 35
PageDown " 34
& up 38
( down 40
% left 37
' right 39

*/
		if(33 <= key && key <= 40) return true;
		if(45 <= key && key <= 46) return true;

		if(key == 27) { // escape
			this.ime.ResetPreedit();
			return false;
		}
		else if(key == 13) { // complete
			if(this.ime.GetPreeditLength() > 0) {
				var preedit = this.ime.GetPreedit();
				var html = '<img src="http://www.forkosh.dreamhost.com/mimetex.cgi?' + escape(preedit) + '" />'; 
				this.ime.SendString(obj,html);
				this.ime.ResetPreedit();
				return false;
			}
			else return true;
		}
		else if(32 <= key && key <= 126) {
			var ch = String.fromCharCode(key);
			this.ime.AppendPreedit(ch,ch);
			return false;
		}
		return true;
	}
});


