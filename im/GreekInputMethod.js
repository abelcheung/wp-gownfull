var GreekInputMethod = InputMethod.extend({
	greek_upper_char_map: [
"\u0391","\u0392","\u03A7","\u0394","\u0395","\u03A6","\u0393","\u0397",
"\u0399","\u03A6","\u039A","\u039B","\u039C","\u039D","\u039F","\u03A0",
"\u0398","\u03A1","\u03A3","\u03A4","\u03A5","\u03A9","\u03A9","\u039E",
"\u03A8","\u0396"],
	greek_lower_char_map: [
"\u03B1","\u03B2","\u03C7","\u03B4","\u03B5","\u03C6","\u03B3","\u03B7",
"\u03B9","\u03C6","\u03BA","\u03BB","\u03BC","\u03BD","\u03BF","\u03C0",
"\u03B8","\u03C1","\u03C3","\u03C4","\u03C5","\u03C9","\u03C9","\u03BE",
"\u03C8","\u03B6"],
	constructor: function()
	{
	},
	IMName: function()
	{
		return 'Greek';
	},
	keypress_handler: function(obj,key) 
	{
		if(key>=65 && key<=90) { // A-Z
			ch = this.greek_upper_char_map[key-65];
			this.ime.SendString(obj,ch);
		}
		else if(key>=97 && key<=122) { // a-z
			ch = this.greek_lower_char_map[key-97];
			this.ime.SendString(obj,ch);
		}
		else return true;
		return false;
	}
});


