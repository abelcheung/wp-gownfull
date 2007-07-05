// Modified from bsdgames
var ChequeInputMethod = InputMethod.extend({
	name1: ['','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT',
		'NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN',
		'SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN'],
	name2: ['','TEN','TWENTY','THIRTY','FORTY','FIFTY','SIXTY','SEVENTY','EIGHTY','NINETY'],
	name3: ['HUNDRED','THOUSAND','MILLION','BILLION','TRILLION',
		'QUADRILLION','QUINTILLION','SEXTILLION','SEPTILLION','OCTILLION','NONILLION',
		'DECILLION','UNDECILLION','DUODECILLION','TREDECILLION','QUATTUORDECILLION',
		'QUINDECILLION','SEXDECILLION','SEPTENDECILLION','OCTODECILLION',
		'NOVEMDECILLION','VIGINTILLION'],
	maxnum: 65,
	result: '',
	constructor: function()
	{
	},
	IMName: function()
	{
		return 'Cheque Amount';
	},
	_Number: function(str,p,len)
	{
		var val,rval;
		rval = 0;
		switch(len) {
		case 3:
			if(str.charCodeAt(p) != 48) {
				rval = 1;
				this.result += lib.sprintf("%s HUNDRED",this.name1[str.charCodeAt(p) - 48]);
			}
			++p;
		case 2:
			val = (str.charCodeAt(p+1) - 48) + (str.charCodeAt(p) - 48) * 10;
			if(val) {
				if(rval) this.result += ' ';
				if(val < 20) this.result += this.name1[val];
				else {
					this.result += this.name2[parseInt(val/10)];
					if(val%10) this.result += lib.sprintf("-%s",this.name1[val%10]);
				}
				rval = 1;
			}
			break;
		case 1:
			if(str.charCodeAt(p) != 48) {
				rval = 1;
				this.result += this.name1[str.charCodeAt(p) - 48];
			}
		}
		return rval;
	},
	_Unit: function(str,p,len)
	{
		var off,rval;

		rval = 0;
		if(len > 3) {
			if(len % 3) {
				off = len%3;
				len -= off;
				if(this._Number(str,p,off)) {
					rval = 1;
					this.result += ' ' + this.name3[parseInt(len / 3)] + ' ';
				}
				p += off;
			}
			for(;len > 3;p += 3) {
				len -= 3;
				if(this._Number(str,p,3)) {
					rval = 1;
					this.result += ' ' + this.name3[parseInt(len / 3)] + ' ';
				}
			}
		}
		if(this._Number(str,p,len)) rval = 1;
		return rval;
	},
	_Convert: function(str)
	{
		var regex = /^(\d+)(.\d+)?$/
		var parts;

		parts = regex.exec(str);
		if(!parts) return false;

		var flen,len,rval;

		this.result = '';

		if(parts[1].length > this.maxnum ||
		   (parts[2] && parts[2].length > 3)) return false;

		if(parts[2]) parts[2] = parts[2].substr(1);

		if(parts[2] && parts[2].length == 1) {
			parts[2] += '0';
		}
		len = parts[1] ? parts[1].length : 0;
		flen = parts[2] ? parts[2].length : 0;
		rval = len > 0 ? this._Unit(parts[1],0,len) : 0;
		if(rval) {
			if(len == 1 && parts[1].charAt(0) == '1') this.result += ' DOLLAR';
			else this.result += ' DOLLARS';
		}
		if(flen != 0) {
			for(p=0;p<parts[2].length;p++) {
				if(parts[2].charCodeAt(p) != 48) {
					if(rval) this.result += ' AND ';
					if(this._Unit(parts[2],p,flen-p)) {
						if(parts[2] == '01') this.result += ' CENT';
						else this.result += ' CENTS';
						rval = 1;
					}
					break;
				}
			}
		}
		if(!rval) this.result += 'ZERO DOLLARS';
		this.result += ' ONLY';
		return true;
	},
	keydown_handler: function(obj,key) 
	{
		if(key == 8) {
			if(this.ime.GetPreeditLength() > 0) {
				this.ime.DeletePreedit(1,1);
				return false;
			}
			else return true;
		}
		else if(key == 190) {
			this.ime.AppendPreedit('.','.');
			return false;
		}
		return true;
	},
	keypress_handler: function(obj,key) 
	{
		if(key == 27) { // escape
			this.ime.ResetPreedit();
			return true;
		}
		else if(key == 32) { // complete
			var preedit = this.ime.GetPreedit();
			if(this._Convert(preedit)) {
				this.ime.SendString(obj,this.result);
				this.ime.ResetPreedit();
			}
			else this.ime.InvalidatePreedit();
			return false;
		}
		else if(48 <= key && key <= 57) { // 0-9
			var ch = String.fromCharCode(key);
			this.ime.AppendPreedit(ch,ch);
			return false;
		}
		else return true;
	}
});


