/*
GownFull - Web 2.0 Input Method Editor

Copyright (c) 2007 Wong Hang <hang.wong@mensa.org.hk>
All rights reserved.

Redistribution and use in source and binary forms, with or 
without modification, are permitted provided that the following
conditions are met:

    * Redistributions of source code must retain the above copyright 
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in
      the documentation and/or other materials provided with the distribution.
    * Neither the name of the GownFull nor the names of its contributors
      may be used to endorse or promote products derived from this software
      without specific prior written permission.

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
var Debug = function() {};
Debug.present = false;
/*
	Base, version 1.0.2
	Copyright 2006, Dean Edwards
	License: http://creativecommons.org/licenses/LGPL/2.1/
*/

var Base = function() {
	if (arguments.length) {
		if (this == window) { // cast an object to this class
			Base.prototype.extend.call(arguments[0], arguments.callee.prototype);
		} else {
			this.extend(arguments[0]);
		}
	}
};

Base.version = "1.0.2";

Base.prototype = {
	extend: function(source, value) {
		var extend = Base.prototype.extend;
		if (arguments.length == 2) {
			var ancestor = this[source];
			// overriding?
			if ((ancestor instanceof Function) && (value instanceof Function) &&
				ancestor.valueOf() != value.valueOf() && /\bbase\b/.test(value)) {
				var method = value;
			//	var _prototype = this.constructor.prototype;
			//	var fromPrototype = !Base._prototyping && _prototype[source] == ancestor;
				value = function() {
					var previous = this.base;
				//	this.base = fromPrototype ? _prototype[source] : ancestor;
					this.base = ancestor;
					var returnValue = method.apply(this, arguments);
					this.base = previous;
					return returnValue;
				};
				// point to the underlying method
				value.valueOf = function() {
					return method;
				};
				value.toString = function() {
					return String(method);
				};
			}
			return this[source] = value;
		} else if (source) {
			var _prototype = {toSource: null};
			// do the "toString" and other methods manually
			var _protected = ["toString", "valueOf"];
			// if we are prototyping then include the constructor
			if (Base._prototyping) _protected[2] = "constructor";
			for (var i = 0; (name = _protected[i]); i++) {
				if (source[name] != _prototype[name]) {
					extend.call(this, name, source[name]);
				}
			}
			// copy each of the source object's properties to this object
			for (var name in source) {
				if (!_prototype[name]) {
					extend.call(this, name, source[name]);
				}
			}
		}
		return this;
	},

	base: function() {
		// call this method from any other method to invoke that method's ancestor
	}
};

Base.extend = function(_instance, _static) {
	var extend = Base.prototype.extend;
	if (!_instance) _instance = {};
	// build the prototype
	Base._prototyping = true;
	var _prototype = new this;
	extend.call(_prototype, _instance);
	var constructor = _prototype.constructor;
	_prototype.constructor = this;
	delete Base._prototyping;
	// create the wrapper for the constructor function
	var klass = function() {
		if (!Base._prototyping) constructor.apply(this, arguments);
		this.constructor = klass;
	};
	klass.prototype = _prototype;
	// build the class interface
	klass.extend = this.extend;
	klass.implement = this.implement;
	klass.toString = function() {
		return String(constructor);
	};
	extend.call(klass, _static);
	// single instance
	var object = constructor ? klass : _prototype;
	// class initialisation
	if (object.init instanceof Function) object.init();
	return object;
};

Base.implement = function(_interface) {
	if (_interface instanceof Function) _interface = _interface.prototype;
	this.prototype.extend(_interface);
};

var DebugWindow = function() {}

var Debug = Base.extend({
	win: null,
	win_id: null,
	buffer: [],
	present: true,
	constructor: null,
	last_time: null,
	start_time: 0,
	verbose: 0,

	init: function()
	{
		this.start_time = (new Date()).getTime();
	},
	start: function(win_id)
	{
		if(win_id) this.win_id = win_id;
		else if(DebugWindow) this.win = new DebugWindow(GownFullConfig.debugwin_id);
		else alert('No Debug <DIV> can be used.');
		this.flush();
	},
	clear: function()
	{
		if(this.win) this.win.clear();
		else if(this.win_id) {
			var obj = document.getElementById(this.win_id);

			obj.innerHTML = '';
		}
		this.buffer = '';
	},
	flush: function()
	{
		if((this.win || this.win_id) && this.buffer && this.buffer.length > 0) {
			for(var i=0;i<this.buffer.length;i++) this.output(this.buffer[i],true);
			this.buffer = [];
		}
	},
	output: function(str,notime)
	{
		if(!notime) {
			var ms = (new Date()).getTime() - this.start_time;
			var now = '[' + ms.toString() + ']: ';
			str = now + str;
		}

		if(this.win) { // if DebugWindow exists
			this.win.output(str);
		}
		else if(this.win_id) { // if a <DIV> is given
			var obj = document.getElementById(this.win_id);
			var msg;

			msg = document.createElement('div');
			msg.className = GownFullConfig.debugwin_msg_class_name;
			msg.innerHTML = str;
			//obj.appendChild(msg);
			obj.insertBefore(msg,obj.firstChild);
			obj.scrollTop = 0;
		}
		else { // put it in internal buffer
			this.buffer.push(str);
		}
	},
	trace: function()
	{
		if (!arguments || arguments.length < 2 || !RegExp)
		{
			return;
		}
		var vb = arguments[0];
		if(vb > this.verbose) return;

		var str = arguments[1];
		var re = /([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X)(.*)/;
		var a = b = [], numSubstitutions = 1, numMatches = 0;
		while (a = re.exec(str))
		{
			var leftpart = a[1], pPad = a[2], pJustify = a[3], pMinLength = a[4];
			var pPrecision = a[5], pType = a[6], rightPart = a[7];
			
			//alert(a + '\n' + [a[0], leftpart, pPad, pJustify, pMinLength, pPrecision);
	
			numMatches++;
			if (pType == '%')
			{
				subst = '%';
			}
			else
			{
				numSubstitutions++;
				var param = arguments[numSubstitutions];
				var pad = '';
					   if (pPad && pPad.substr(0,1) == "'") pad = leftpart.substr(1,1);
				  else if (pPad) pad = pPad;
				var justifyRight = true;
					   if (pJustify && pJustify === "-") justifyRight = false;
				var minLength = -1;
					   if (pMinLength) minLength = parseInt(pMinLength);
				var precision = -1;
					   if (pPrecision && pType == 'f') precision = parseInt(pPrecision.substring(1));
				var subst = param;
					   if (pType == 'b') subst = parseInt(param).toString(2);
				  else if (pType == 'c') subst = String.fromCharCode(parseInt(param));
				  else if (pType == 'd') subst = parseInt(param) ? parseInt(param) : 0;
				  else if (pType == 'u') subst = Math.abs(param);
				  else if (pType == 'f') subst = (precision > -1) ? Math.round(parseFloat(param) * Math.pow(10, precision)) / Math.pow(10, precision): parseFloat(param);
				  else if (pType == 'o') subst = parseInt(param).toString(8);
				  else if (pType == 's') subst = param;
				  else if (pType == 'x') subst = ('' + parseInt(param).toString(16)).toLowerCase();
				  else if (pType == 'X') subst = ('' + parseInt(param).toString(16)).toUpperCase();
			}
			str = leftpart + subst + rightPart;
		}
		this.output(str);
	},
	start_timer: function()
	{
		this.last_time = (new Date).getTime();
	},
	end_timer: function(vb,msg)
	{
		if(this.last_time == null) return;

		if(vb <= this.verbose) {
			var now = (new Date).getTime();
			this.output(msg.replace(/\$TIMER/,parseInt(now - this.last_time)) + "<br />");
		}
		this.last_time = null;
	}
});

var lib = Base.extend({
	constructor: null,
	// sprintf() implementation for javascript
	// wonghang: I copied it from http://jan.moesen.nu/code/javascript/sprintf-and-printf-in-javascript/,
	//           the page said it is in Public Domain, so it is free to use
	sprintf: function () 
	{
		if (!arguments || arguments.length < 1 || !RegExp)
		{
			return;
		}
		var str = arguments[0];
		var re = /([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X)(.*)/;
		var a = b = [], numSubstitutions = 0, numMatches = 0;
		while (a = re.exec(str))
		{
			var leftpart = a[1], pPad = a[2], pJustify = a[3], pMinLength = a[4];
			var pPrecision = a[5], pType = a[6], rightPart = a[7];
			
			//alert(a + '\n' + [a[0], leftpart, pPad, pJustify, pMinLength, pPrecision);
	
			numMatches++;
			if (pType == '%')
			{
				subst = '%';
			}
			else
			{
				numSubstitutions++;
				if (numSubstitutions >= arguments.length)
				{
					Debug.trace(0,'lib.sprintf: Error! Not enough function arguments (' + (arguments.length - 1) + ', excluding the string)\nfor the number of substitution parameters in string (' + numSubstitutions + ' so far).');
				}
				var param = arguments[numSubstitutions];
				var pad = '';
					   if (pPad && pPad.substr(0,1) == "'") pad = leftpart.substr(1,1);
				  else if (pPad) pad = pPad;
				var justifyRight = true;
					   if (pJustify && pJustify === "-") justifyRight = false;
				var minLength = -1;
					   if (pMinLength) minLength = parseInt(pMinLength);
				var precision = -1;
					   if (pPrecision && pType == 'f') precision = parseInt(pPrecision.substring(1));
				var subst = param;
					   if (pType == 'b') subst = parseInt(param).toString(2);
				  else if (pType == 'c') subst = String.fromCharCode(parseInt(param));
				  else if (pType == 'd') subst = parseInt(param) ? parseInt(param) : 0;
				  else if (pType == 'u') subst = Math.abs(param);
				  else if (pType == 'f') subst = (precision > -1) ? Math.round(parseFloat(param) * Math.pow(10, precision)) / Math.pow(10, precision): parseFloat(param);
				  else if (pType == 'o') subst = parseInt(param).toString(8);
				  else if (pType == 's') subst = param;
				  else if (pType == 'x') subst = ('' + parseInt(param).toString(16)).toLowerCase();
				  else if (pType == 'X') subst = ('' + parseInt(param).toString(16)).toUpperCase();
			}
			str = leftpart + subst + rightPart;
		}
		return str;
	},
	AppendHead: function(node)
	{
		var head;

		head = document.getElementsByTagName('head');
		head = head.item(0);

		head.appendChild(node);
		return true;
	},
	LoadCSSFile: function(file)
	{
		var link = document.createElement('link');

		link.href = file;
		link.rel = 'stylesheet';
		link.type = 'text/css';

		Debug.trace(0,"lib.LoadCSSFile: Load a CSS from <a href=\"%s\">%s</a>",link.href,link.href);
		return this.AppendHead(link);
	},
	RunScript: function(s)
	{
		if(window.execScript) window.execScript(s);
		else window.eval(s);
	},
	GetEventTarget: function(e)
	{
		var t;
		
		if(e.target) t = e.target;
		else if(e.srcElement) t = e.srcElement;
		//if(t.nodeType == 3) t = t.parentNode;// for Safari bug (I search in Google)
		return t;
	},
	isUndefined: function(obj)
	{
		return (typeof(obj) == 'undefined') ? true : false;
	},
	time: function()
	{
		var a = new Date;
		return a.getTime();
	},
	openURL: function(url)
	{
		window.open(url,'_blank');
	},
	GetScrollX: function()
	{
		if(document.documentElement) return document.documentElement.scrollLeft;
		else return document.body.scrollLeft;
	},
	GetScrollY: function()
	{
		if(document.documentElement) return document.documentElement.scrollTop;
		else return document.body.scrollTop;
	},
	GetClientWidth: function()
	{
		if(document.documentElement) return document.documentElement.clientWidth;
		else return document.body.clientWidth;
	},
	GetClientHeight: function()
	{
		if(document.documentElement) return document.documentElement.clientHeight;
		else return document.body.clientHeight;
	},
	/*  
	*  (c) 2006 Michael Porter
	*/
	InvalidUtf8Exception: function () {},
	utf8str: function(codes) 
	{
		var codes = [].concat(codes);
		codes.reverse();
		var getCode = function () {
			if(codes.length == 0) throw new this.InvalidUtf8Exception;
			return codes.pop();
		}
		var result = [];
		try {
			while (codes.length > 0) {
				var code0 = getCode();
				if (code0 < 0x80) result.push(code0);
				else {
					var code1 = getCode();
					if (code0 < 0xE0) result.push(((code0 & 0x1F) << 6) | (code1 & 0x3F));
					else {
						var code2 = getCode();
						if (code0 < 0xF0) result.push(((code0 & 0xF) << 12) | ((code1 & 0x3F) << 6) | (code2 & 0x3F));
						else {
							var code3 = getCode();
							if (code0 < 0xF8) result.push(((code0 & 0x7) << 18) | ((code1 & 0x3F) << 12) | ((code2 & 0x3F) << 6) | (code3 & 0x3F));
							else throw new this.InvalidUtf8Exception();
						}
					}
				}
			}
		}
		catch (e) {
			if (e instanceof this.InvalidUtf8Exception) result = [];
			else throw e;
		}
		return this.utf16str(result);
	},
	utf16str: function(codes) 
	{
		var result = [];
		for (var i = 0; i < codes.length; i += 1) {
			var code = codes[i];
			if (code <= 0xFFFF) result.push(String.fromCharCode(code));
			else if (code <= 0x10FFFF) {
				result.push(String.fromCharCode(
//					0xD800 | (((code >>> 16) & 0x1F) - 1) | ((code >>> 10) & 0x3F),
					0xD800 | (((code - 0x10000) >>> 10) & 0x3FF),
					0xDC00 | (code & 0x3FF)
				));
			}
			else return [];
		}
		return result.join("");
	},
	utf16char: function(code)
	{
		var result = [];
		if (code <= 0xFFFF) result.push(String.fromCharCode(code));
		else if (code <= 0x10FFFF) {
			result.push(String.fromCharCode(
//				0xD800 | (((code >>> 16) & 0x1F) - 1) | ((code >>> 10) & 0x3F),
				0xD800 | (((code - 0x10000) >>> 10) & 0x3FF),
				0xDC00 | (code & 0x3FF)
			));
		}
		return result.join("");
	},
	chartoutf16: function(ch)
	{
		var ch1 = ch.charCodeAt(0);
		if(ch1 < 0xD800 || ch1 > 0xDFFF) return ch1;
		else {
			var ch2 = charCodeAt(1);
			return ((((ch2 >>> 6) & 0xF) + 1) << 16) | (ch1 & 0x3F) << 10 | (ch2 & 0x3FF);
		}
	},
	utf16charlen: function(ch)
	{
		var c = ch.charCodeAt(0);
		if(c < 0xD800 || c > 0xDFFF) return 1;
		else return 2;
	}
});
var GownFullBrowserDetect = Base.extend({
	constructor: null,
	BROWSER_UNKNOWN: 0,
	BROWSER_IE: 1,
	BROWSER_FIREFOX: 2,
	BROWSER_OPERA: 3,
	BROWSER_KONQUEROR: 4,
	BROWSER_SAFARI: 5,
	BROWSER_MINIMO: 6,
	current_browser: null,
	use_attachEvent: null,
	use_addEventListener: null,
	use_key_addEventListener: null,
	use_mouse_addEventListener: null,
	need_windowreference: null,
	use_css_position_fixed: null,
	use_css_position_absolute: null,
	running_mobile: null,

	init: function()
	{
		this.init_useragent();
		if(this.current_browser == this.BROWSER_UNKNOWN) this.init_objtest();

		Debug.present && (this.current_browser == this.BROWSER_IE) && Debug.trace(0,"GownFullBrowserDetect: Running Internet Explorer.");
		Debug.present && (this.current_browser == this.BROWSER_FIREFOX) && Debug.trace(0,"GownFullBrowserDetect: Running Mozilla Firefox.");
		Debug.present && (this.current_browser == this.BROWSER_OPERA) && Debug.trace(0,"GownFullBrowserDetect: Running Opera.");
		Debug.present && (this.current_browser == this.BROWSER_KONQUEROR) && Debug.trace(0,"GownFullBrowserDetect: Running Konqueror.");
		Debug.present && (this.current_browser == this.BROWSER_SAFARI) && Debug.trace(0,"GownFullBrowserDetect: Running Safari.");
		Debug.present && (this.current_browser == this.BROWSER_MINIMO) && Debug.trace(0,"GownFullBrowserDetect: Running Minimo.");
		Debug.present && (this.current_browser == this.BROWSER_UNKNOWN) && Debug.trace(0,"GownFullBrowserDetect: Running unknown browser.");
		Debug.present && (this.running_mobile) && Debug.trace(0,"GownFullBrowserDetect: Running Mobile device.");
		Debug.present && this.use_attachEvent && Debug.trace(0,"GownFullBrowserDetect: GownFull can use attachEvent.");
		Debug.present && this.use_addEventListener && Debug.trace(0,"GownFullBrowserDetect: GownFull can use addEventListener.");
		Debug.present && this.use_key_addEventListener && Debug.trace(0,"GownFullBrowserDetect: GownFull should use addEventListener on key events.");
		Debug.present && this.use_mouse_addEventListener && Debug.trace(0,"GownFullBrowserDetect: GownFull should use addEventListener on mouse events.");
		Debug.present && this.use_css_position_fixed && Debug.trace(0,"GownFullBrowserDetect: GownFull can use position: fixed in CSS.");
		Debug.present && this.use_css_position_absolute && Debug.trace(0,"GownFullBrowserDetect: GownFull can use position: absolute in CSS.");
	},
	init_useragent: function()
	{
		Debug.trace(0,"GownFullBrowserDetect: Detecting using user-agent...");

		var useragent = navigator.userAgent;

		Debug.trace(0,"GownFullBrowserDetect: %s",useragent);

		useragent = useragent.toLowerCase();

		var isIE = (useragent.indexOf('msie') < 0) ? false : true;
		var isFirefox = (useragent.indexOf('firefox') < 0) ? false : true;
		var isOpera = (useragent.indexOf('opera') < 0) ? false : true;
		var isKonqueror = (useragent.indexOf('konqueror') < 0) ? false : true;
		var isSafari = (useragent.indexOf('safari') < 0) ? false : true;
		var isMinimo = (useragent.indexOf('minimo') < 0) ? false : true;
		var isPPC = (useragent.indexOf('ppc') < 0) ? false : true;
		var isWinCE = (useragent.indexOf('windows ce') < 0) ? false : true;

		if(isOpera && isIE) isIE = false;

		if(isIE) this.current_browser = this.BROWSER_IE;
		else if(isFirefox) this.current_browser = this.BROWSER_FIREFOX;
		else if(isOpera) this.current_browser = this.BROWSER_OPERA;
		else if(isKonqueror) this.current_browser = this.BROWSER_KONQUEROR;
		else if(isSafari) this.current_browser = this.BROWSER_SAFARI;
		else if(isMinimo) this.current_browser = this.BROWSER_MINIMO;
		else this.current_browser = this.BROWSER_UNKNOWN;

		this.use_attachEvent = (isIE) ? true : false;
		this.use_addEventListener = (isFirefox || isMinimo || isOpera || isKonqueror || isSafari) ? true : false;
		this.use_key_addEventListener = (isFirefox || isMinimo || isKonqueror || isSafari) ? true : false;
		this.use_mouse_addEventListener = (isFirefox || isMinimo || isOpera || isKonqueror || isSafari) ? true : false;
		this.need_windowreference = (isKonqueror || isSafari) ? true : false;
		this.running_mobile = (isPPC || isWinCE) ? true : false;
		if(this.running_mobile) {
			this.use_css_position_fixed = false;
			this.use_css_position_absolute = false;
		}
		else {
			this.use_css_position_fixed = (isFirefox || isMinimo || isOpera || isKonqueror || isSafari) ? true : false;
			this.use_css_position_absolute = true;
		}
	},
	init_objtest: function()
	{
		Debug.trace(0,"GownFullBrowserDetect: Detecting using object existence...");
	
		this.use_attachEvent = (document.attachEvent) ? true : false;
		this.use_addEventListener = (document.addEventListener) ? true : false;
		this.use_key_addEventListener = (document.addEventListener) ? true : false;
		this.use_mouse_addEventListener = (document.addEventListener) ? true : false;
		this.use_css_position_fixed = true;

		lib.RunScript('var x = 123;');
		try { this.need_windowreference = (x == null || x != 123) ? true : false; }
		catch(e) { this.need_windowreference = true; }

		if(this.use_attachEvent) this.current_browser = this.BROWSER_IE;
		else this.current_browser = this.BROWSER_UNKNOWN;


		Debug.present && (this.current_browser == this.BROWSER_IE) && Debug.trace(0,"GownFullBrowserDetect: Running Internet Explorer.");
		Debug.present && (this.current_browser == this.BROWSER_UNKNOWN) && Debug.trace(0,"GownFullBrowserDetect: Running unknown browser.");
	}
});


var GFWindowBehavior = Base.extend({
	constructor: function() {},
	PreCreateWindow: function(win) {},
	PostCreateWindow: function(win) {},
	DestroyWindow: function(win) {},
	SetFocus: function(win) {},
	BringToTop: function(win) {},
	SetWindowPosition: function(win,x,y) {},
	ShowWindow: function(win) {},
	SetContent: function(win) {}
});

var GFWindowsMovableHandler; // to prevent some javascript error 

var firefox_mousemove = function(e) { return GFWindowsMovableHandler.onmousemove(e); };
var firefox_mousedown = function(e) { return GFWindowsMovableHandler.onmousedown(e); };
var firefox_mouseup = function(e) { return GFWindowsMovableHandler.onmouseup(e); };
var firefox_scroll = function(e) { return GFWindowsMovableHandler.onscroll(e); }; // should not be called.

GFWindowsMovableHandler = Base.extend({
	registered_id: {},
	moving_win: null,
	mouse_offsetx: null,
	mouse_offsety: null,
	top_z: 1,
	constructor: null,
	old_onscroll: null,
	old_onresize: null,
	last_width: null,
	last_height: null,
	init: function()
	{	
		var x = this;

		if(GownFullBrowserDetect.use_css_position_fixed) {
			Debug.trace(0,"GFWindowsMovableHandler: Using position: fixed, attached onresize event.");
			this.old_onresize = window.onresize;
			window.onresize = function() { return x.onresize(window.event); }
		}
		else if(GownFullBrowserDetect.use_css_position_absolute) {
			this.old_onscroll = window.onscroll;
			window.onscroll = function() { return x.onscroll(window.event); }
			this.old_onresize = window.onresize;
			window.onresize = function() { return x.onresize(window.event); }
			Debug.trace(0,"GFWindowsMovableHandler: Using position: absolute, attached onscroll/onresize event.");
		}
		else {
			Debug.trace(0,"GFWindowsMovableHandler: Movable Window is not supported in this browser.");
		}
		this.last_width = lib.GetClientWidth();
		this.last_height = lib.GetClientHeight();
	},
	skipnodeName: {
		'textarea': true,
		'input': true,
		'select': true,
		'a': true,
		'button': true
	},
	SetXY: function(win,x,y)
	{
		if(win.id) this.registered_id[win.id] = [x,y];

		if(GownFullBrowserDetect.use_css_position_fixed) {
			win.style.left = lib.sprintf('%dpx',x);
			win.style.top = lib.sprintf('%dpx',y);
		}
		else if(GownFullBrowserDetect.use_css_position_absolute) {
			win.style.left = lib.sprintf('%dpx',x + lib.GetScrollX());
			win.style.top = lib.sprintf('%dpx',y + lib.GetScrollY());
		}
	},
	RegisterWindow: function(div_obj,id,init_x,init_y)
	{	
		var x = this;

		if(GownFullBrowserDetect.use_mouse_addEventListener) {
			div_obj.addEventListener("mousemove", firefox_mousemove,true);
			div_obj.addEventListener("mousedown", firefox_mousedown,true);
			div_obj.addEventListener("mouseup", firefox_mouseup,true);
		}
		else if(GownFullBrowserDetect.use_attachEvent) {
			div_obj.attachEvent("onmousemove", function(e) { return x.onmousemove(e); });
			div_obj.attachEvent("onmousedown", function(e) { return x.onmousedown(e); });
			div_obj.attachEvent("onmouseup", function(e) { return x.onmouseup(e); });
		}	
		else { // use the most generic one (probably fails)
			div_obj.onmousemove = function() { return x.onmousemove(window.event); }
			div_obj.onmousedown = function() { return x.onmousedown(window.event); }
			div_obj.onmouseup = function() { return x.onmouseup(window.event); }
		}
		div_obj.style.zIndex = this.top_z++;
		this.registered_id[id] = [init_x,init_y];
		Debug.trace(0,'GFWindowsMovableHandler: Register a window (id=%s)',id);
	},
	UnregisterWindow: function(id)
	{
		this.registered_id[id] = false;
		delete this.registered_id[id];
		// FIXME
		Debug.trace(0,'GFWindowsMovableHandler: Unregister a window (id=%s)',id);
	},
	GetParentDiv: function(obj)
	{
		while(obj) {
			if(obj.id && this.registered_id[obj.id] && obj.tagName.toLowerCase() == 'div') return obj;
			if(obj.parentElement) obj = obj.parentElement;
			else return null;
		}
		return null;
	},
	onscroll: function(e)
	{
		for(var key in this.registered_id) {
			Debug.trace(3,'GFWindowsMovableHandler (onscroll): handling for id=%s',key);
			var d = document.getElementById(key);
			var pos = this.registered_id[key];
			if(!d) {
				Debug.trace(0,'GFWindowsMovableHandler (onscroll): Something get wrong, getElementById(%s) fails',key);
				continue;
			}
			this.SetXY(d,pos[0],pos[1]);
		}
		if(this.old_onscroll) this.old_onscroll();
	},
	onresize: function(e)
	{
		for(var key in this.registered_id) {
			Debug.trace(3,'GFWindowsMovableHandler (onresize): handling for id=%s',key);
			var d = document.getElementById(key);
			var pos = this.registered_id[key];

			if(!d) {
				Debug.trace(0,'GFWindowsMovableHandler (onresize): Something get wrong, getElementById(%s) fails',key);
				continue;
			}
			pos[0] = (pos[0] / this.last_width) * lib.GetClientWidth();
			pos[0] = Math.round(pos[0]);
			pos[1] = (pos[1] / this.last_height) * lib.GetClientHeight();
			pos[1] = Math.round(pos[1]);
			this.SetXY(d,pos[0],pos[1]);
		}
		this.last_width = lib.GetClientWidth();
		this.last_height = lib.GetClientHeight();
		if(this.old_onresize) this.old_onresize();
	},
	onmousedown: function(e)
	{
		var curr = e.srcElement || e.target;
		var win = e.currentTarget || this.GetParentDiv(curr);

		if(win && win.id) {
			if(!this.registered_id[win.id]) return;
		}
		if(curr && curr.nodeName) {
			var nodename = curr.nodeName.toLowerCase();

			if(this.skipnodeName[nodename] == true) return;
			if(nodename == 'div' && !this.registered_id[curr.id]) return;
		}

		if(win && win.style) {
			win.style.zIndex = this.top_z++;
			
			this.AttachDocumentHandler(true);
			this.moving_win = win;
			if(GownFullBrowserDetect.use_css_position_fixed) {
				this.mouse_offsetx = e.clientX - win.offsetLeft;
				this.mouse_offsety = e.clientY - win.offsetTop;
			}
			else if(GownFullBrowserDetect.use_css_position_absolute) {
				this.mouse_offsetx = e.clientX + lib.GetScrollX() - win.offsetLeft;
				this.mouse_offsety = e.clientY + lib.GetScrollY() - win.offsetTop;
			}
			if(e.preventDefault) e.preventDefault();
			else {
				document.onselectstart = function () { return false; };
				e.cancelBubble = true;
				return false;
			}
		}
	},
	onmousemove: function(e)
	{
		if(this.moving_win) {
			if (!e.preventDefault) {
				if(e.button == 0) {
					this.StopDrag(e);
					return;
				}
			}
			GFWindowsMovableHandler.SetXY(this.moving_win,e.clientX - this.mouse_offsetx,e.clientY - this.mouse_offsety);
			if(e.preventDefault) e.preventDefault();
			else {
				e.cancelBubble = true;
				return false;
			}
		}
	},
	onmouseup: function(e)
	{
		if(this.moving_win) this.StopDrag(e);
	},
	StopDrag: function(e)
	{
		var finalX = e.clientX - this.mouse_offsetx;
		var finalY = e.clientY - this.mouse_offsety;
	
		if(finalX < 0) finalX = 0;
		if(finalY < 0) finalY = 0;
	
		GFWindowsMovableHandler.SetXY(this.moving_win,finalX,finalY);
	
		this.AttachDocumentHandler(false);
		this.moving_win = null;
		if(e.preventDefault) e.preventDefault();
		else {
			document.onselectstart = null;
			e.cancelBubble = true;
			return false;
		}
	},
	AttachDocumentHandler: function(attach)
	{
		var x = this;
		
		if(attach) {
			if(GownFullBrowserDetect.use_mouse_addEventListener) {
				document.addEventListener("mousemove", firefox_mousemove,true);
				document.addEventListener("mousedown", firefox_mousedown,true);
				document.addEventListener("mouseup", firefox_mouseup,true);
			}
			else {
				document.onmousedown = function() { return x.onmousedown(window.event); } ;
				document.onmousemove = function() { return x.onmousemove(window.event); } ;
				document.onmouseup = function() { return x.onmouseup(window.event); } ;
			}
		}
		else {
			if(GownFullBrowserDetect.use_mouse_addEventListener) {
				document.removeEventListener("mousemove", firefox_mousemove,true);
				document.removeEventListener("mousedown", firefox_mousedown,true);
				document.removeEventListener("mouseup", firefox_mouseup,true);
			}
			else {
				document.onmousedown = null;
				document.onmousemove = null;
				document.onmouseup = null;
			}
		}
	}
});

var GFWindowMovableBehavior = GFWindowBehavior.extend({
	init_x: 0,
	init_y: 0,
	width: null,
	height: null,
	div_obj: null,
	class_name: null,
	obj_id: null,
	constructor: function(id,init_x,init_y,width,height,class_name)
	{
		this.obj_id = id;
		if(init_x) this.init_x = init_x;
		if(init_y) this.init_y = init_y;
		if(width) this.width = width;
		if(height) this.height = height;
		if(class_name) this.class_name = class_name;
	},
	PreCreateWindow: function(win)
	{
		this.div_obj = document.createElement('div');
		this.div_obj.id = this.obj_id;
		this.div_obj.className = this.class_name;

		if(this.width != null) this.div_obj.style.width = lib.sprintf('%dpx',this.width);
		if(this.height != null) this.div_obj.style.height = lib.sprintf('%dpx',this.height);

		if(GownFullBrowserDetect.use_css_position_fixed) {
			this.div_obj.style.position = 'fixed';
		}
		else if(GownFullBrowserDetect.use_css_position_absolute) {
			this.div_obj.style.position = 'absolute';
		}
		GFWindowsMovableHandler.SetXY(this.div_obj,this.init_x,this.init_y);
		GFWindowsMovableHandler.RegisterWindow(this.div_obj,this.obj_id,this.init_x,this.init_y);
	},
	PostCreateWindow: function(win)
	{
		document.body.appendChild(this.div_obj);
	},
	DestroyWindow: function(win)
	{
		GFWindowsMovableHandler.UnregisterWindow(this.obj_id);
		document.body.removeChild(this.div_obj);
		this.div_obj = null;
	},
	SetFocus: function(win)
	{
		if(this.div_obj.focus) this.div_obj.focus();
		return true;
	},
	BringToTop: function(win)
	{
		this.div_obj.style.zIndex = GFWindowsMovableHandler.top_z++;
		return true;
	},
	SetWindowPosition: function(win,x,y)
	{
		GFWindowsMovableHandler.SetXY(this.div_obj,x,y);
		return true;
	},
	ShowWindow: function(win,show)
	{
		if(show) this.div_obj.style.display = 'block';
		else this.div_obj.style.display = 'none';
		return true;
	},
	SetContent: function(win,content)
	{
		this.div_obj.innerHTML = content;
	}
});

var GFWindowFixedBehavior = GFWindowBehavior.extend({
	div_id: null,
	div_obj: null,
	class_name: null,
	constructor: function(div_id,class_name)
	{
		this.div_id = div_id;
		this.div_obj = document.getElementById(div_id);
		this.class_name = class_name;
	},
	PreCreateWindow: function(win)
	{
		this.div_obj.className = this.class_name;
	},
	PostCreateWindow: function(win)
	{
	},
	DestroyWindow: function(win)
	{
		this.div_obj.innerHTML = '';
		this.div_obj = null;
	},
	SetFocus: function(win)
	{
		if(this.div_obj.focus) this.div_obj.focus();
		return true;
	},
	BringToTop: function(win)
	{
		return true;
	},
	SetWindowPosition: function(win,x,y)
	{
		return true;
	},
	ShowWindow: function(win,show)
	{
		if(show) this.div_obj.style.display = 'block';
		else this.div_obj.style.display = 'none';
		return true;
	},
	SetContent: function(win,content)
	{
		this.div_obj.innerHTML = content;
	}
});

var GFWindow = Base.extend({
	behavior: null,
	shown: false,
	constructor: function(behavior,hidden,content)
	{
		this.behavior = behavior;
		this.behavior.PreCreateWindow(this);
		this.shown = !hidden;
		this.behavior.ShowWindow(this,!hidden);
		this.behavior.SetContent(this,content);
		this.behavior.PostCreateWindow(this);
	},
	ShowWindow: function(show) { this.shown = show; return this.behavior.ShowWindow(this,show); },
	DestroyWindow: function() { return this.behavior.DestroyWindow(this); },
	SetFocus: function() { return this.behavior.SetFocus(this); },
	BringToTop: function() { return this.behavior.BringToTop(this); },
	SetWindowPosition: function(x,y) { return this.behavior.SetWindowPosition(this,x,y); }
});
var DebugWindow = GFWindow.extend({
	obj_id: null,
	constructor: function(id)
	{
		var html;
		var x = this;

		this.obj_id = id;
		html = '<span>Debug Console</span><br />';	
		html += lib.sprintf('<div nowrap="nowrap" class="%s" id="' + id + '_DebugArea"></div><br />',GownFullConfig.debugwin_main_class_name);
		html += '<button id="' + id + '_Dec">&lt;</button>';
		html += '<span id="' + id + '_Verbose">&nbsp;</span>';
		html += '<button id="' + id + '_Inc">&gt;</button>';
		html += '&nbsp;<button id="' + id + '_Button">Clear</button>';
		this.base(new GFWindowMovableBehavior(id,400,20,null,null,GownFullConfig.debugwin_class_name),false,html);

		// get back the button and attach the event
		if(GownFullBrowserDetect.use_addEventListener) {
			var b;

			b = document.getElementById(this.obj_id + '_Button');
			b.addEventListener('click',function() { x.clear(); },false);
			b = document.getElementById(this.obj_id + '_Inc');
			b.addEventListener('click',function() { x.increase_verbose(); },false);
			b = document.getElementById(this.obj_id + '_Dec');
			b.addEventListener('click',function() { x.decrease_verbose(); },false);
		}
		else {
			var b;

			b = document.getElementById(this.obj_id + '_Button');
			b.onclick = function() { x.clear(); }
			b = document.getElementById(this.obj_id + '_Inc');
			b.onclick = function() { x.increase_verbose(); }
			b = document.getElementById(this.obj_id + '_Dec');
			b.onclick = function() { x.decrease_verbose(); }
		}

		this.update_verbose();
	},
	output: function(str)
	{
		var obj,msg;

		obj = document.getElementById(this.obj_id + '_DebugArea');
		if(!obj) return;
		msg = document.createElement('div');
		msg.className = GownFullConfig.debugwin_msg_class_name;
		msg.innerHTML = str;
		obj.insertBefore(msg,obj.firstChild);
//		obj.appendChild(msg);
		obj.scrollTop = 0;
	},
	clear: function()
	{
		var obj;

		obj = document.getElementById(this.obj_id + '_DebugArea');
		if(!obj) return;
		obj.innerHTML = '';
	},
	update_verbose: function()
	{
		var obj;

		obj = document.getElementById(this.obj_id + '_Verbose');
		if(!obj) return;
		if(obj.firstChild) obj.firstChild.nodeValue = 'Verbose: '+Debug.verbose;
	},
	decrease_verbose: function()
	{
		Debug.verbose--;
		Debug.verbose = (Debug.verbose < 0) ? 0 : Debug.verbose;
		this.update_verbose();
	},
	increase_verbose: function()
	{
		Debug.verbose++;
		this.update_verbose();
	}
});
var GownFullConfig = Base.extend({
	constructor: null,
	gownfull_base_url: 'http://127.0.0.1/gownfull/',
	css_file: 'http://127.0.0.1/gownfull/gownfull.css',
	getim_url: 'http://127.0.0.1/gownfull/getim.php',
	download_url: 'http://127.0.0.1/gownfull/download.php',
	debugwin_class_name: 'GownFull_DebugWnd',
	debugwin_main_class_name: 'GownFull_DebugWnd_main',
	debugwin_msg_class_name: 'GownFull_DebugWnd_msg',
	mainwin_class_name: 'GownFull_MainWnd',
	mainmenu_class_name: 'GownFull_MainMenu',
	candwin_class_name: 'GownFull_CandidateListWnd',
	preedit_class_name: 'GownFull_Preedit',
	preedit_status_class_name: 'GownFull_PreeditStatus',
	preedit_invalid_class_name: 'GownFull_PreeditInvalid',
	disable_input_method_class_name: 'GownFull_DisableIM',
	available_input_method_class_name: 'GownFull_AvailableIM',
	download_input_method_class_name: 'GownFull_DownloadIM',
	mainwin_id: '1674bab9-6fc5-46c5-8d44-1dcda9b93302',
	candwin_id: '2cfd5456-79d1-426d-a831-e95631c88dcf',
	debugwin_id: 'd632be66-acee-4f38-8afc-600569fb7224'
});
var DownloadManager = Base.extend({
	constructor: null,
	download: [],
	download_available: 0,
	downloading_count: 0,

	_Add: function(obj)
	{
		var ret;

		ret = this.download_available;
		this.download[ret] = obj;
		for(;this.download[this.download_available];) this.download_available++;
		Debug.trace(2,'DownloadManager: download=(%s), download_available=%d, downloading_count=%d',this.download,this.download_available,this.downloading_count);
		return ret;
	},
	_Remove: function(id)
	{
		this.download[id] = null;
		if(id < this.download_available) this.download_available = id;
		Debug.trace(2,'DownloadManager: download=(%s), download_available=%d, downloading_count=%d',this.download,this.download_available,this.downloading_count);
	},
	NewDownload: function(url,callback,userdata,noid)
	{
		var url;
		var obj = {};
		var id;
		var node;

		if(callback) obj.callback = callback;
		if(userdata) obj.userdata = userdata;
		id = this._Add(obj);
		
		node = document.createElement('script');
		node.type = 'text/javascript';
		if(noid) node.src = url;
		else node.src = url + '&download_callback_id=' + id;
		Debug.trace(0,'DownloadManager: Start downloading (%d) from <a href="%s">%s</a>',id,node.src,node.src);
		document.body.appendChild(node);
		this.downloading_count++;
		return id;
	},
	ServerCallback: function(id,data)
	{
		var obj;

		obj = this.download[id];
		if(obj) {
			Debug.trace(0,'DownloadManager: Download id=%d completed.',id);
			this._Remove(id);
			obj.callback(obj.userdata,data);
			this.downloading_count--;
		}
		else {
			Debug.trace(0,'DownloadManager: Invalid callback id=%d',id);
		}
	}
});

var ProgressiveObject = Base.extend({
	constructor: function()
	{
	},
	onCompleteComponent: function(name)
	{
		return true;
	},
	onErrorComponent: function(name)
	{
		return true;
	},
	GetClass: function()
	{
		return ProgressiveObject;
	},
	DownloadComponent: function(name)
	{
		var _this = this;
		var data = {};
		if(!_this.component_src[name]) return;

		data.name = name;
		data._this = _this;
		data.x = this;

		DownloadManager.NewDownload(_this.component_src[name],
		function(userdata,serverdata) {
			if(serverdata) {
				for(var key in serverdata) {
					if(key == 'dummy') continue;
					userdata._this[key] = serverdata[key];
				}
				userdata._this.component_src[userdata.name] = null;
				userdata.x.onCompleteComponent(userdata.name);
			}
			else userdata.x.onErrorComponent(userdata.name);
		},data);
	},
	DownloadComponentStatic: function(name)
	{
		var data = {};
		var _this = this.GetClass();

		if(!_this.component_src[name]) return;

		data.name = name;
		data._this = _this;
		data.x = this;
		
		DownloadManager.NewDownload(_this.component_src[name],
		function(userdata,serverdata) {
			if(serverdata) {
				for(var key in serverdata) {
					if(key == 'dummy') continue;
					userdata._this[key] = serverdata[key];
				}
				userdata._this.component_src[userdata.name] = null;
				userdata.x.onCompleteComponent(userdata.name);
			}
			else userdata.x.onErrorComponent(userdata.name);
		},data);
	}
});
var GFMainWindow = GFWindow.extend({
	selchg_handler: null,
	TYPE_DISABLED: 0,
	TYPE_AVAILABLE: 1,
	TYPE_DOWNLOAD: 2,
	constructor: function(behavior,content,selchg_handler)
	{
		this.base(behavior,false,content);
		this.selchg_handler = selchg_handler;
	},
	CreateExtensionDIV: function(id,class_name,width,height,content)
	{
	},
	DestroyExtensionDIV: function(id)
	{
	},
	GetSelect: function()
	{
	},
	AddSelectOption: function(text,value,type)
	{
	},
	ReplaceSelectOption: function(old_value,text,value,type)
	{
	},
	SelectOption: function(value)
	{
	},
	GetPreedit: function()
	{
	},
	SetPreedit: function()
	{
	},
	ResetPreedit: function()
	{
	},
	SetPreeditText: function(str)
	{
	},
	DeletePreedit: function(c)
	{
	},
	AppendPreedit: function(c)
	{
	},
	SetPreeditInvalid: function()
	{
	}
});

var GFCandidateListWindow = GFWindow.extend({
	constructor: function(behavior,content)
	{
		this.base(behavior,true,content);
	},
	GetCandiadateObject: function(i)
	{
	},
	SetCandidate: function(i,str)
	{
	}
});

var GownFullObjectHandler = Base.extend({
	sendstr_id_handler: {},
	sendstr_nodeName_handler: {},
	constructor: function()
	{
	},
	SendString: function(obj,str)
	{
		var handler;

		handler = null;
		// check if there is a id
		if(obj.id && this.sendstr_id_handler[obj.id]) handler = this.sendstr_id_handler[obj.id];
		if(!handler && obj.nodeName) { 
			var nodename = obj.nodeName.toLowerCase();
			handler = this.sendstr_nodeName_handler[nodename];
		}
		if(!handler) {
			Debug.trace(0,'GownFullObjectHandler: no object handler exists for this object (nodeName=%s).',obj.nodeName);
			return false; // no handler exist
		}

		return handler(obj,str);
	}
});

var GownFullBuilder = Base.extend({
	keydown_handler: null,
	keyup_handler: null,
	keypress_handler: null,
	SetHandler: function(keydown_handler,keyup_handler,keypress_handler)
	{
		this.keydown_handler = keydown_handler;
		this.keyup_handler = keyup_handler;
		this.keypress_handler = keypress_handler;
	},
	constructor: function()
	{
	},
	BuildObjectHandler: function()
	{
	},
	BuildCSS: function()
	{
	},
	BuildMainWindow: function()
	{
	},
	BuildCandidateListWindow: function()
	{
	},
	PostCreateGownFull: function()
	{
	},
	AttachHandler: function(obj)
	{
		return false;
	}
});
var GenericMainWindow = GFMainWindow.extend({
	obj_id: null,
	constructor: function(id,selchg_handler,fixed)
	{
		var html;
		var x = this;

		html = '<ul>';
		html += lib.sprintf('<li style="font-size: small;">GownFull</li>',id);
		html += lib.sprintf('<li><select id="%s_Select"><option class="%s" value="0">Disabled</option></select></li>',id,GownFullConfig.disable_input_method_class_name);
		html += lib.sprintf('<li id="%s_Extension">&nbsp;</li>',id);
		html += lib.sprintf('<li><span id="%s_Preedit" class="%s">&nbsp;</span></li>',id,GownFullConfig.preedit_class_name);
		html += '</ul>';

		this.obj_id = id;
		if(fixed) this.base(new GFWindowFixedBehavior(id,GownFullConfig.mainwin_class_name),html,selchg_handler);
		else this.base(new GFWindowMovableBehavior(id,0,0,null,null,GownFullConfig.mainwin_class_name),html,selchg_handler);

		var sel = this.GetSelect();
		if(sel) {
			if(GownFullBrowserDetect.use_addEventListener) 
				sel.addEventListener('change',function() { return x.onSelectChange(this); },false);
			else 
				sel.onchange = function() { return x.onSelectChange(this); };
		}
	},
	CreateExtensionDIV: function(id,class_name,width,height,content)
	{
		var node;
		var ext;

		ext = document.getElementById(lib.sprintf('%s_Extension',this.obj_id));
		if(!ext) return null;

		node = document.createElement('span');
		if(class_name) node.className = class_name;
		if(width) node.style.width = lib.sprintf('%dpx',width);
		if(height) node.style.height = lib.sprintf('%dpx',height);
		node.innerHTML = content;
		ext.appendChild(node);
		Debug.trace(0,"GenericGownFullBuilder: Create an extension DIV with id=\"%s\"",id);
		return node;
	},
	DestroyExtensionDIV: function(id)
	{
		var node;
		var ext;

		ext = document.getElementById(lib.sprintf('%s_Extension',this.obj_id));
		if(!ext) return false;

		node = document.getElementById(id);
		if(!node) return false;

		ext.removeChild(node);
		Debug.trace(0,"GenericGownFullBuilder: Destroy extension DIV id=\"%s\"",id);
		return true;
	},
	GetSelect: function()
	{
		var buf;
		
		buf = document.getElementById(this.obj_id + '_Select');
		if(buf) return buf;
		else return null;
	},
	AddSelectOption: function(text,value,type)
	{
		var sel = this.GetSelect();
		var opt = document.createElement('option');
		opt.value = value;
		switch(type) {
		case this.TYPE_AVAILABLE: opt.className = GownFullConfig.available_input_method_class_name; break;
		case this.TYPE_DOWNLOAD: opt.className = GownFullConfig.download_input_method_class_name; break;
		default: opt.className = GownFullConfig.disable_input_method_class_name; break;
		}
		opt.appendChild(document.createTextNode(text));
		sel.appendChild(opt);
		return opt;
	},
	ReplaceSelectOption: function(old_value,text,value,type)
	{
		var sel = this.GetSelect();
		// find option object with value == old
		var i,opt;
		var e = sel.childNodes;
		
		opt = null;
		for(i=0;i<e.length;i++) {
			obj = e[i];
			if(obj.value && obj.value == old_value) opt = obj;
		}
		if(!opt) return false;

		var newopt = document.createElement('option');
		newopt.value = value;
		switch(type) {
		case this.TYPE_AVAILABLE: opt.className = GownFullConfig.available_input_method_class_name; break;
		case this.TYPE_DOWNLOAD: opt.className = GownFullConfig.download_input_method_class_name; break;
		default: opt.className = GownFullConfig.disable_input_method_class_name; break;
		}
		newopt.appendChild(document.createTextNode(text));
		sel.replaceChild(newopt,opt);
		return newopt;
	},
	SelectOption: function(value)
	{
		var sel = this.GetSelect();
		var opt;
		// select the new opt
		for(i=0;i<sel.options.length;i++) {
			opt = sel.options[i];
			if(opt && opt.value == value) {
				sel.selectedIndex = i;
				this.selchg_handler(opt.value);
				break;
			}
		}
	},
	GetPreedit: function()
	{
		var buf;
		
		buf = document.getElementById(this.obj_id + '_Preedit');
		if(buf) return buf;
		else return null;
	},
	SetPreedit: function(str)
	{
		var buf;
		
		buf = document.getElementById(this.obj_id + '_Preedit');
//		if(buf && buf.firstChild) buf.firstChild.nodeValue = str;
		buf.innerHTML = str;
	},
	ResetPreedit: function()
	{
		var buf;

		buf = this.GetPreedit();
		if(buf) {
			if(buf.className) buf.className = GownFullConfig.preedit_class_name;
//			if(buf.firstChild) buf.firstChild.nodeValue = '';
			buf.innerHTML = '';
		}
	},
	SetPreeditText: function(str)
	{
		var buf;

		buf = this.GetPreedit();
		if(buf) {
			if(buf.className) buf.className = GownFullConfig.preedit_status_class_name;
			//if(buf.firstChild) buf.firstChild.nodeValue = str;
			buf.innerHTML = str;
		}
	},
	DeletePreedit: function(c)
	{
		var buf;

		if(c == null) c = 1;

		buf = this.GetPreedit();
		if(buf) {
			if(buf.className && buf.className != GownFullConfig.preedit_class_name) this.ResetPreedit();
			var str = buf.innerHTML;
			str = str.substr(0,str.length - c);
			buf.innerHTML = str;
/*			if(buf.firstChild) {
				var str = buf.firstChild.nodeValue;
				str = str.substr(0,str.length - c);
				buf.firstChild.nodeValue = str;
			}
*/
		}
	},
	AppendPreedit: function(c)
	{
		var buf;

		buf = this.GetPreedit();
		if(buf) {
			if(buf.className) {
				if(buf.className != GownFullConfig.preedit_class_name) {
					 //if(buf.firstChild) buf.firstChild.nodeValue = '';
					buf.innerHTML = '';
				}
				buf.className = GownFullConfig.preedit_class_name;
			}
			buf.innerHTML += c;
//			if(buf.firstChild) buf.firstChild.nodeValue += c;
		}
	},
	SetPreeditInvalid: function()
	{
		var buf;

		buf = this.GetPreedit();
		if(buf) buf.className = GownFullConfig.preedit_invalid_class_name;
	},
	onSelectChange: function(sel)
	{
		this.selchg_handler(sel.value);
	}
});

var GenericCandidateListWindow = GFCandidateListWindow.extend({
	obj_id: null,
	constructor: function(id,fixed)
	{
		var html = '<span>Candidates</span>';
		html += '<ol>';

		for(i=1;i<=9;i++) {
			html += lib.sprintf('<li id="%s_Candidate%d">&nbsp;</li>',id,i);
		}
		html += '</ol>';

		this.obj_id = id;
		if(fixed) this.base(new GFWindowFixedBehavior(id,GownFullConfig.candwin_class_name),html);
		else this.base(new GFWindowMovableBehavior(id,Math.round(lib.GetClientWidth()/3),0,128,null,GownFullConfig.candwin_class_name),html);
	},
	GetCandidateObject: function(i)
	{
		return document.getElementById(lib.sprintf("%s_Candidate%d",this.obj_id,i));
	},
	SetCandidate: function(i,str)
	{
		var obj,text;

		obj = this.GetCandidateObject(i);
		if(!obj) return false;
		if(!obj.firstChild) return false;
		text = obj.firstChild;
		text.nodeValue = str;
		return true;
	}
});

var GenericGownFullObjectHandler = GownFullObjectHandler.extend({
	constructor: function()
	{
	},
	sendstr_nodeName_handler: {
		'input': function(o,s) 
		{
			if(o.type && o.type == 'text') {
				if(o.focus) o.focus();
				if(o.selectionStart != null) {
					var last_scrollleft = o.scrollLeft;
					var last_scrolltop = o.scrollTop;
					var start = o.selectionStart;
					var end = o.selectionEnd;
					var len = o.value.length;
	
					o.value = o.value.substring(0,start) + s + o.value.substring(end,len);
					start = start + s.length;
					end = start;
					if(o.setSelectionRange) o.setSelectionRange(start,end);
					else {
						o.selectionStart = start;
						o.selectionEnd = end;
					}
					o.scrollLeft = last_scrollleft;
					o.scrollTop = last_scrolltop;
				}
				else if(document.selection) {
					var sel = document.selection.createRange();
					sel.text = s;
					sel.collapse(false);
					sel.select();
				}
				else o.value += s;
			}
			else return false;
		},
		'textarea': function(o,s) 
		{
			if(o.focus) o.focus();
			if(o.selectionStart != null) {
				var last_scrollleft = o.scrollLeft;
				var last_scrolltop = o.scrollTop;
				var start = o.selectionStart;
				var end = o.selectionEnd;
				var len = o.value.length;

				o.value = o.value.substring(0,start) + s + o.value.substring(end,len);
				start = start + s.length;
				end = start;
				if(o.setSelectionRange) o.setSelectionRange(start,end);
				else {
					o.selectionStart = start;
					o.selectionEnd = end;
				}
				o.scrollLeft = last_scrollleft;
				o.scrollTop = last_scrolltop;
			}
			else if(document.selection) {
				var sel = document.selection.createRange();
				sel.text = s;
				sel.collapse(false);
				sel.select();
			}
			else o.value += s;
		},
		'html': function(o,s)  // iframe
		{
			var win;

			if(!o.GownFull_iframe) {
				Debug.trace(0,'GenericGownFullObjectHandler: (iframe) handler cannot get iframe reference.');
				return;
			}
			o = o.GownFull_iframe;

			GenericGownFullObjectHandler.SendHTML(o,s);
		}
	}
},
{
	SendHTML: function(ifme,html)
	{
		try {
			var doc;

			if(ifme.document) doc = ifme.document;
			else if(ifme.contentDocument) doc = ifme.contentDocument;

			doc.execCommand('insertHTML',false,html);
			return true;
		}
		catch(e) {}
		try {
			var sel = null;

			if(ifme.getSelection) sel = ifme.getSelection();
			else if(ifme.document && ifme.document.selection) sel = ifme.document.selection;

			var rng = sel.createRange();
			rng.pasteHTML(html);
			rng.collapse(false);
			rng.select();
			return true;
		}
		catch(e) {}
		Debug.trace(0,"GenericGownFullBuilder: SendHTML: Failure to send HTML to iframe, maybe current browser is not supported.");
		return false;
	}
});

var GenericGownFullBuilder = GownFullBuilder.extend({
	show: true,
	last_im: 0,
	config: null,

	constructor: function(config)
	{
		this.config = {};
		this.config.mainwin_id = GownFullConfig.mainwin_id;
		this.config.candwin_id = GownFullConfig.candwin_id;
		this.config.css_file = GownFullConfig.css_file;
		this.config.fixed = false;
		this.config.applyall = true;

		if(config) {
			for(var key in config) this.config[key] = config[key];
		}
		Debug.trace(0,'GownFullBuilder: Using GenericGownFullBuilder (fixed=%s).',this.config.fixed);
		this.base();
	},
	BuildObjectHandler: function()
	{
		return new GenericGownFullObjectHandler;
	},
	BuildCSS: function()
	{
		return lib.LoadCSSFile(this.config.css_file);
	},
	BuildMainWindow: function(selchg)
	{
		if(this.config.fixed) return new GenericMainWindow(this.config.mainwin_id,selchg,true);
		else return new GenericMainWindow(this.config.mainwin_id,selchg);
	},
	BuildCandidateListWindow: function()
	{
		if(this.config.fixed) return new GenericCandidateListWindow(this.config.candwin_id,true);
		else return new GenericCandidateListWindow(this.config.candwin_id);
	},
	onKeyDown: function(e)
	{
		var key = e.which ? e.which : e.keyCode;
		var obj = lib.GetEventTarget(e);
		var b;
		var m = 0;

		if(e.altKey) m |= GownFull.KEY_ALT;
		else if(e.ctrlKey) m |= GownFull.KEY_CTRL;
		else if(e.shiftKey) m |= GownFull.KEY_SHIFT;

		b = this.keydown_handler(obj,key,m);
		
		if(!b) {
			if(e.preventDefault) e.preventDefault();
		}
		return b;
	},
	onKeyUp: function(e)
	{
		var key = e.which ? e.which : e.keyCode;
		var obj = lib.GetEventTarget(e);
		var b;
		var m = 0;

		if(e.altKey) m |= GownFull.KEY_ALT;
		else if(e.ctrlKey) m |= GownFull.KEY_CTRL;
		else if(e.shiftKey) m |= GownFull.KEY_SHIFT;

		b = this.keyup_handler(obj,key,m);

		if(!b) {
			if(e.preventDefault) e.preventDefault();
		}
		return b;
	},
	onKeyPress: function(e)
	{
		var key = e.which ? e.which : e.keyCode;
		var obj = lib.GetEventTarget(e);
		var b;
		var m = 0;

		if(e.altKey) m |= GownFull.KEY_ALT;
		else if(e.ctrlKey) m |= GownFull.KEY_CTRL;
		else if(e.shiftKey) m |= GownFull.KEY_SHIFT;

		b = this.keypress_handler(obj,key,m);

		if(!b) {
			if(e.preventDefault) e.preventDefault();
		}
		return b;
	},
	AttachHandler: function(obj)
	{
		var x = this;

		if(obj.nodeName && obj.nodeName.toLowerCase() == 'iframe') {
			var doc;

			if(obj.document) doc = obj.document;
			else if(obj.contentDocument) doc = obj.contentDocument;

			if(doc.documentElement) doc.documentElement.GownFull_iframe = obj;
			obj = doc;
		}

		if(GownFullBrowserDetect.use_key_addEventListener) {
			obj.addEventListener("keydown", function(e) { return x.onKeyDown(e); },true);
			obj.addEventListener("keypress", function(e) { return x.onKeyPress(e); },true);
			obj.addEventListener("keyup", function(e) { return x.onKeyUp(e); },true);
		}
		else {
			obj.onkeydown = function() { return x.onKeyDown(window.event); }
			obj.onkeypress = function() { return x.onKeyPress(window.event); }
			obj.onkeyup = function() { return x.onKeyUp(window.event); }
		}
		return true;
	},
	ApplyInputMethodByTagName: function(name,filter)
	{
		var nodes,c,i;

		nodes = document.getElementsByTagName(name);
		c = 0;
		for(i=0;i<nodes.length;i++) {
			if(!filter || filter(nodes.item(i))) {
				if(this.AttachHandler(nodes.item(i))) c++;
			}
		}
		Debug.trace(0,"GenericGownFullBuilder: Input Method attached for HTML tag %s, %d attached.",name,c);
		return c;
	},
	PostCreateGownFull: function()
	{
		if(this.config.applyall) {
			this.ApplyInputMethodByTagName('input',function(obj) { return (obj.type && obj.type == 'text') ? true : false; });
			this.ApplyInputMethodByTagName('textarea');
			this.ApplyInputMethodByTagName('iframe', function(obj) {
				var doc;

				if(obj.contentDocument) doc = obj.contentDocument;
				else if(obj.document) doc = obj.document;
				else return false;

				try {
					if(doc.designMode && doc.designMode == 'on') return true;
					else return false;
				}
				catch(e) {
					Debug.trace(0,"GenericGownFullBuilder: PostCreateGownFull, apply for (iframe), exception: %s",e);
					return false;
				}
			});
		}
	}
});
var GFIterator = Base.extend({
	constructor: function()
	{
	},
	next: function()
	{
	},
	prev: function()
	{
	},
	current: function()
	{
	},
	nullp: function()
	{
	}
});


var GFListNode = Base.extend({
	prev: null,
	next: null,
	data: null,
	constructor: function(next,prev,data)
	{
		this.data = data;
		this.prev = prev;
		this.next = next;
	}
});

var GFListIterator = GFIterator.extend({
	list: null,
	node: null,
	constructor: function(list,node)
	{
		this.list = list;
		this.node = node;
	},
	next: function()
	{
		if(this.node != null) this.node = this.node.next;
		return (this.node != null) ? true : false;
	},
	prev: function()
	{
		if(this.node != null) this.node = this.node.prev;
		return (this.node != null) ? true : false;
	},
	nullp: function()
	{
		return (this.node == null) ? true : false;
	},
	current: function()
	{
		return (this.node == null) ? null : (this.node.data);
	},
	insertbefore: function(data)
	{
		if(this.list == null) return false;
		if(this.node == null) {
			this.list.push_tail(data);
			return true;
		}
		if(this.node == this.list.head) {
			this.list.push_head(data);
			return true;
		}

		var p = new GFListNode(this.node,this.node.prev,data);
		this.node.prev = p;
		if(p.next != null) p.next.prev = p;
		if(p.prev != null) p.prev.next = p;
		this.node = p;
		this.list.count++;
		return true;
	},
	insertafter: function(data)
	{
		if(this.list == null) return false;
		if(this.node == null) {
			this.list.push_head(data);
			return true;
		}
		if(this.node == this.list.tail) {
			this.list.push_tail(data);
			return true;
		}

		var p = new GFListNode(this.node.next,this.node,data);
		this.node.next = p;
		if(p.next != null) p.next.prev = p;
		if(p.prev != null) p.prev.next = p;
		this.node = p;
		this.list.count++;
		return true;
	},
	remove: function()
	{
		var p = this.node;
		if(this.node.prev != null) this.node.prev.next = this.node.next;
		if(this.node.next != null) this.node.next.prev = this.node.prev;
		if(this.node == this.list.head) this.list.head = this.node.next;
		if(this.node == this.list.tail) this.list.tail = this.node.prev;
		this.node = this.node.next;
		delete p;
		this.list.count--;
	}
});

var GFList = Base.extend({
	head: null,
	tail: null,
	count: 0,
	constructor: function()
	{
	},
	push_head: function(data)
	{
		var p = new GFListNode(this.head,null,data);

		if(this.head != null) this.head.prev = p;
		this.head = p;
		if(this.tail == null) this.tail = this.head;
		this.count++;
	},
	push_tail: function(data)
	{
		var p = new GFListNode(null,this.tail,data);

		if(this.tail != null) this.tail.next = p;
		this.tail = p;
		if(this.head == null) this.head = this.tail;
		this.count++;
	},
	get_head: function()
	{
		if(this.head) return this.head.data;
		else null;
	},
	get_tail: function()
	{
		if(this.tail) return this.tail.data;
		else null;
	},
	pop_head: function()
	{
		var p = this.head;

		if(p == null) return false;
		if(p.next != null) p.next.prev = null;
		this.head = p.next;
		if(p == this.tail) this.tail = null;
		delete p;
		this.count--;
		return true;
	},
	pop_tail: function()
	{
		var p = this.tail;

		if(p == null) return false;
		if(p.prev != null) p.prev.next = null;
		this.tail = p.prev;
		if(p == this.head) this.head = null;
		delete p;
		this.count--;
		return true;
	},
	push: function(data) { this.push_head(data); },
	pop: function(data) { this.pop_head(data); },
	remove_all: function()
	{
		this.count = 0;
		this.head = null;
		this.tail = null;
	},
	begin: function()
	{
		return new GFListIterator(this,this.head);
	},
	end: function()
	{
		return new GFListIterator(this,this.tail);
	}
});

var InputMethod = ProgressiveObject.extend({
	// variable to point to GownFull object
	ime: null,
	// constructor for the input method
	constructor: function()
	{
	},
	/* IMName: This function should return the display name of
	   the input method.
	*/
	IMName: function()
	{
		return 'BaseClass';
	},
	/* keydown_handler: 
           This function should process for the HTML element onKeyDown event.
           obj - The HTML object that triggers the event.
           key - The code of the key.

           return true if the key is not handled by the InputMethod.
           return false if the key is handled by the InputMethod.
	*/
	keydown_handler: function(obj,key,modifiers) 
	{
		return true;
	},
	/* keyup_handler: 
           This function should process for the HTML element onKeyUp event.
           obj - The HTML object that triggers the event.
           key - The code of the key.

           return true if the key is not handled by the InputMethod.
           return false if the key is handled by the InputMethod.
	*/
	keyup_handler: function(obj,key,modifiers)
	{
		return true;
	},
	/* keypress_handler: 
           This function should process for the HTML element onKeyPress event.
           obj - The HTML object that triggers the event.
           key - The code of the key.

           return true if the key is not handled by the InputMethod.
           return false if the key is handled by the InputMethod.
	*/
	keypress_handler: function(obj,key,modifiers)
	{
		return true;
	},
	/* onActive:
	   This function is called when the user select this InputMethod
	*/
	onActive: function()
	{
		return true;
	},
	/* onDeactive:
	   This function is called when the user select another InputMethod (or disabled)
	*/
	onDeactive: function()
	{
		return true;
	}
});
var OutputModifier = Base.extend({
	ime: null,
	constructor: function(ime)
	{
		this.ime = ime;
	},
	ModifierName: function()
	{
		return 'BaseClass';
	},
	IsVisible: function()
	{
		return false;
	},
	Modify: function(str)
	{
		return str;
	},
	Remove: function()
	{
	}
});
var GownFullMenu = Base.extend({
	ime: null,
	available: false,
	last_im: 0,
	escape_last: 0,

	items: [

	{ display: 'Toggle on/off IME', func: function(menu)
		{
			if(menu.ime.mainwin.shown) {
				menu.last_im = menu.ime.im_current;
				menu.ime.ToggleIME(false);
			}
			else {
				menu.ime.ToggleIME(true);
				menu.ime.SelectInputMethod(menu.last_im);
			}
		}
	},

	{ display: 'GownFull Blog', func: function(menu)
		{
			lib.openURL('http://gownfull.blogspot.com/');
		}
	}

	],
	constructor: function(ime)
	{
		this.ime = ime;
	},
	SelectItem: function(i)
	{
		var item = this.items[i];

		if(item) item.func(this);
	},
	ShowMenu: function()
	{
		var i;

		this.ime.ResetPreedit();
		for(i=0;i<9;i++) {
			if(i >= this.items.length) this.ime.SetCandidate(i+1,' ');
			else this.ime.SetCandidate(i+1,this.items[i].display);
		}
		this.ime.ShowCandidateListWindow(true);
		this.available = true;
	},
	HideMenu: function()
	{
		this.ime.ShowCandidateListWindow(false);
		this.available = false;
	},
	keydown_handler: function(obj,code)
	{
		return true;
	},
	keypress_handler: function(obj,code)
	{
		if(this.available) {
			if(49 <= code && code <= 59) { // 1-9
				this.SelectItem(code-49);
				this.HideMenu();
				return false;
			}
			else {
				this.HideMenu();
				return true;
			}
		}
		else {
			var now = lib.time();

			if(code == 27) {
				if(this.escape_last > 0 && now - this.escape_last < 500) {
					this.escape_last = 0;
					this.ShowMenu();
					return false;
				}
				else this.escape_last = now;
			}
			return true;
		}
	},
	keyup_handler: function(obj,code)
	{
		return true;
	}
});

var GownFull = Base.extend({
	constructor: function(builder)
	{
		var i;
		var x = this;

		this.builder = builder;
		this.handlers = builder.BuildObjectHandler();

		builder.BuildCSS();
		this.mainwin = builder.BuildMainWindow(function(v) { x.onSelectChange(v); });
		this.candwin = builder.BuildCandidateListWindow();
		builder.SetHandler(function(obj,key,m) { return x.keydown_handler(obj,key,m); },
				function(obj,key,m) { return x.keyup_handler(obj,key,m); },
				function(obj,key,m) { return x.keypress_handler(obj,key,m); });

		if(GownFull.instance) {
			Debug.trace(0,'GownFull: Error, more than one instance of GownFull created.');
		}
		GownFull.instance = this;

		this.menu = new GownFullMenu(this);

		builder.PostCreateGownFull();
	},

	mainwin: null,
	candwin: null,
	handlers: null,
	builder: null,

	preedit: '',
	im_array: [],
	im_current: 0,
	download_array: [],
	download_count: 0,
	modifiers: new GFList,
	menu: null,

	onSelectChange: function(value)
	{
		var im,i;

		if(value < 0) {
			// disable first
			if(this.im_current > 0) {
				im = this.im_array[this.im_current-1];
				im.onDeactive();
			}
			this.im_current = 0;
			this.ResetPreedit();
			// get url
			i = -value;
			i--;
			data = this.download_array[i];
			this.DownloadInputMethod(data.objname,value);
		}
		else {
			if(this.im_current > 0) {
				im = this.im_array[this.im_current-1];
				im.onDeactive();
			}
			this.im_current = value;
			Debug.trace(1,'GownFull: Select Input Method %d',value);
			this.ResetPreedit();
			if(this.im_current > 0) {
				im = this.im_array[this.im_current-1];
				im.onActive();
			}
		}
	},
	keydown_handler: function(obj,key,modifiers)
	{
		var b;

		Debug.trace(4,'GownFull: keydown_handler key=%d, modifiers=%b',key,modifiers);

		b = true;
		if(this.im_current > 0) {
			var im = this.im_array[this.im_current-1];
	
			b = im.keydown_handler(obj,key,modifiers);
		}

		if(!this.menu.keydown_handler(obj,key,modifiers)) b = false;
		
		return b;
	},
	keyup_handler: function(obj,key,modifiers)
	{
		var b;

		Debug.trace(4,'GownFull: keyup_handler key=%d, modifiers=%b',key,modifiers);

		b = true;

		if(this.im_current > 0) {
			var im = this.im_array[this.im_current-1];
	
			b = im.keyup_handler(obj,key,modifiers);
		}
		if(!this.menu.keyup_handler(obj,key,modifiers)) b = false;
		return b;
	},
	keypress_handler: function(obj,key,modifiers)
	{
		var b;

		Debug.trace(4,'GownFull: keypress_handler key=%d, modifiers=%b',key,modifiers);

		b = true;

		if(this.im_current > 0) {
			var im = this.im_array[this.im_current-1];

			b = im.keypress_handler(obj,key,modifiers);
		}
		if(!this.menu.keypress_handler(obj,key,modifiers)) b = false;
		return b;
	},
	RegisterInputMethod: function(im)
	{
		var i = this.im_array.length;
		this.im_array[i] = im;
		// add new select
		this.mainwin.AddSelectOption(im.IMName(),i+1,this.mainwin.TYPE_AVAILABLE);
		im.ime = this;
		Debug.trace(0,"GownFull: Register a Input Method \"%s\", id=%d",im.IMName(),i+1);
		return (i+1);
	},
	RegisterDownload: function(objname,name)
	{
		var i = this.download_array.length;
		this.download_array[i] = { name: name, objname: objname };
		// add new select
		this.mainwin.AddSelectOption(name,-i-1,this.mainwin.TYPE_DOWNLOAD);
		Debug.trace(0,"GownFull: Register an available Input Method (objname=\"%s\", name=\"%s\" id=%d)",objname,name,i+1);
		return (i+1);
	},
	DownloadInputMethod: function(objname,old_i)
	{
		var url;
		var data = {};

		url = lib.sprintf("%s?objname=%s",GownFullConfig.getim_url,objname);
		Debug.trace(0,"GownFull: Download Input Method %s",objname);
		
		this.SetPreeditText(lib.sprintf("Loading %s...",objname));

		data.objname = objname;
		data.old_i = old_i;
		this.download_count++;
		DownloadManager.NewDownload(url,
			function(userdata,serverdata) { 
				if(serverdata) {
					GownFull.instance.DownloadInputMethod2(serverdata,userdata.old_i);
					GownFull.instance.ResetPreedit();
				}
				else {
					GownFull.instance.SetPreeditText(userdata.objname+' does not exist.');
				}
				GownFull.instance.download_count--;
			},
		data);
		return true;
	},
	DownloadInputMethod2: function(im,old)
	{
		var j = this.im_array.length;
		
		this.im_array[j] = im;
		this.mainwin.ReplaceSelectOption(old,im.IMName(),j+1,GFCandidateListWindow.TYPE_AVAILABLE);
		im.ime = this;
/*		if(GownFull.instance.download_count == 1) */this.mainwin.SelectOption(j+1);
		Debug.trace(0,"GownFull: Input Method \"%s\" downloaded successfully. (id=%d)",im.IMName(),j+1);
		return (j+1);
	},
	SelectInputMethod: function(i)
	{
		this.mainwin.SelectOption(i);
	},
	ToggleIME: function(show)
	{
		if(show) {
			this.mainwin.SelectOption(0);
			this.mainwin.ShowWindow(true);
			Debug.trace(1,"GownFull: ToggleIME on");
		}
		else {
			this.mainwin.SelectOption(0);
			this.mainwin.ShowWindow(false);
			this.candwin.ShowWindow(false);
			Debug.trace(1,"GownFull: ToggleIME off");
		}
	},
	GetPreedit: function() { return this.preedit; },
	ResetPreedit: function()
	{
		this.mainwin.ResetPreedit();
		this.preedit = '';
		this.candwin.ShowWindow(false);
	},
	GetPreeditLength: function()
	{
		return this.preedit.length;
	},
	SetPreeditText: function(str)
	{
		this.mainwin.SetPreeditText(str);
		this.preedit = '';
	},
	// c - number of characters delete in preedit
	// dc - number of characters delete in display preedit
	DeletePreedit: function(c,dc)
	{
		var buf;

		if(dc == null) dc = 1;
		if(c == null) c = 1;

		this.mainwin.DeletePreedit(dc);
		this.preedit = this.preedit.substr(0,this.preedit.length - c);
	},
	AppendPreedit: function(c,dc)
	{
		this.mainwin.AppendPreedit(dc);
		this.preedit += c;
	},
	InvalidatePreedit: function()
	{
		this.mainwin.SetPreeditInvalid();
		this.preedit = '';
	},
	SetPreedit: function(s,ds)
	{
		this.mainwin.SetPreedit(ds);
		this.preedit = s;
	},
	SetCandidate: function(i,s) { return this.candwin.SetCandidate(i,s); },
	ShowCandidateListWindow: function(show) 
	{
		if(show) {
			this.candwin.ShowWindow(true);
			this.candwin.BringToTop();
		}
		else return this.candwin.ShowWindow(false);
	},
	SendString: function(o,s)
	{
		var it = this.modifiers.begin();
		var p;
		while(!it.nullp()) {
			p = it.current();
			Debug.trace(1,"GownFull: Modify \"%s\" by %s",s,p.ModifierName());
			s = p.Modify(s);
			it.next();
		}
		Debug.trace(1,"GownFull: Send string \"%s\"",s,this.handlers);
		return this.handlers ? this.handlers.SendString(o,s) : false; 
	}
},
{
	KEY_SHIFT: 1,
	KEY_CTRL: 2,
	KEY_ALT: 4,
	instance: null
});
var SimpleTableInputMethod = InputMethod.extend({
	content_level: 0,
	content_total: 0,
	/* max_key_length: (integer)
           maximum length of preedit (If the preedit length reachs this value, onComplete is called)
        */
	max_key_length: 0,
	auto_complete: true,
        // internal used for selection choice list
	current_pos: 0,
	current_list: null,

	constructor: function(clv)
	{
		this.base();
		var key;
		var i;

		// convert the char map
		for(key in this.GetClass().char_map) {
			this.GetClass().char_map[key] = lib.utf16char(this.GetClass().char_map[key]);
		}
		clv = (!clv || clv > this.content_total) ? this.content_total : clv;
		this.content_level = 0;
		for(i=0;i<clv;i++) {
			this.DownloadComponentStatic(lib.sprintf('table%d',i));
		}
	},
	UpdateTable: function()
	{
		var i;
		var _this = this.GetClass();

		Debug.trace(1,"SimpleTableInputMethod: Update content level from %d...",this.content_level);
		for(this.content_level;;this.content_level++) {
			i = this.content_level;
			if(_this['table'+i]) {
				var key;
				var map = _this['table'+i];
				Debug.trace(1,"SimpleTableInputMethod: Content %d available...updating...",i);
				for(var key in map) {
					if(_this.table[key]) _this.table[key] = _this.table[key].concat(map[key]);
					else _this.table[key] = map[key];
				}
			}
			else break;
		}
		Debug.trace(1,"SimpleTableInputMethod: At Content level %d.",this.content_level);
	},
	onCompleteComponent: function(name)
	{
		var lv = parseInt(name.substr(5));
		var i;
		var _this = this.GetClass();

		Debug.trace(1,"SimpleTableInputMethod: Component %s download completed.",name);

		this.UpdateTable();
		if(this.ime.GetPreeditLength() > 0) {
			var key = this.ime.GetPreedit();
			this.current_list = this.GetClass().table[key];
			this.UpdateCandidate();
		}
	},
	onErrorComponent: function(name)
	{
		Debug.trace(0,"SimpleTableInputMethod: Component %s has errors.",name);
	},
	GetClass: function()
	{
		return SimpleTableInputMethod;
	},
	IMName: function()
	{
		return "SimpleTableInputMethod";
	},
	keydown_handler: function(obj,key) 
	{
		var b = true;
		switch(key) {
		case 8: // Backspace
			b = !this.onDeletePreedit(obj);
			break;
		case 188: // previous page
			b = !this.onPreviousPage(obj);
			break;
		case 190: // next page
			b = !this.onNextPage(obj);
			break;
		default:
			break;
		}
		return b;
	},
	keypress_handler: function(obj,key) 
	{
		var b = true;
		switch(key) {
		case 27: // Esc
			b = !this.onCancel(obj);
			break;
		case 32: // Space
			if(this.IsCandidateAvailable()) {
				this.onNextPage(obj);
				return false;
			}
			if(this.ime.GetPreeditLength() > 0) {
				this.onComplete(obj);
				return false;
			}
			break;
		case 49: case 50: case 51: case 52: case 53:
		case 54: case 55: case 56: case 57:
			if(this.IsCandidateAvailable()) b = !this.onSelectCandidate(obj,key-49);
			break;
		default:
			break;
		}

		if(!b) return false;

		if(this.ime.GetPreeditLength() >= this.max_key_length) return false;
		else {
			var ch = String.fromCharCode(key);
			var dch = this.GetClass().char_map[ch];

			if(dch) {
				if(this.current_list) this.onSelectCandidate(obj,0);
				this.ime.AppendPreedit(ch,dch);
				Debug.trace(1,"SimpleTableInputMethod: Append Preedit (%s,%s)",ch,dch);
			}
			else return true;
	
			if(this.ime.GetPreeditLength() == this.max_key_length && this.auto_complete) {
				Debug.trace(1,"SimpleTableInputMethod: Auto-complete!");
				this.onComplete(obj);
			}
			return false;
		}
	},
	onActive: function()
	{
		this.current_pos = 0;
		this.current_list = null;
	},
	onDeactive: function()
	{
		this.current_pos = 0;
		this.current_list = null;
	},
	onDeletePreedit: function(obj)
	{
		if(this.ime.GetPreeditLength() > 0) {
			this.ime.DeletePreedit(1,1);
			this.current_pos = 0;
			this.current_list = null;
			this.ime.ShowCandidateListWindow(false);
			return true;
		}
		else return false;
	},
	onCancel: function(obj)
	{
		this.ime.ResetPreedit();
		this.current_pos = 0;
		this.current_list = null;
	},
	IsCandidateAvailable: function()
	{
		if(this.current_list) return true;
		else return false;
	},
	onComplete: function(obj)
	{
		var key = this.ime.GetPreedit();
		var list = this.GetClass().table[key];
		var loaddone = (this.content_level == this.content_total) ? true : false;

		if(!list) {
			Debug.trace(1,"SimpleTableInputMethod: No lists for key=\"%s\".",key);
			this.ime.InvalidatePreedit();
			return false;
		}
		if(list.length == 0 && loaddone) {
			Debug.trace(1,"SimpleTableInputMethod: Zero records found for key=\"%s\".",key);
			this.ime.InvalidatePreedit();
			return false;
		}
		else if(list.length == 1 && loaddone) {
			Debug.trace(1,"SimpleTableInputMethod: One record found for key=\"%s\".",key);
			this.ime.SendString(obj,lib.utf16char(list[0]));
			this.ime.ResetPreedit();
			return true;
		}
		else {
			Debug.trace(1,"SimpleTableInputMethod: %d records found for key=\"%s\".",list.length,key);
			this.current_pos = 0;
			this.current_list = list;
			this.UpdateCandidate();
			return false;
		}
		return true;
	},
	UpdateCandidate: function()
	{
		if(this.current_list) {
			var i;

			for(i=0;i<9;i++) {
				var pos = this.current_pos + i;
				var loaddone = (this.content_level == this.content_total) ? true : false;

				if(pos >= this.current_list.length) this.ime.SetCandidate(i+1,loaddone ? ' ' : 'Still loading...');
				else this.ime.SetCandidate(i+1,lib.utf16char(this.current_list[pos]));
			}
			this.ime.ShowCandidateListWindow(true);
		}
		else {
			for(i=0;i<9;i++) {
				this.ime.SetCandidate(i+1,' ');
			}
			this.ime.ShowCandidateListWindow(false);
		}
	},
	SelectInternalCandidate: function(obj,pos)
	{
		this.ime.ResetPreedit();
		this.ime.SendString(obj,lib.utf16char(this.current_list[pos]));
		this.current_list = null;
		this.current_pos = 0;
		this.UpdateCandidate();
	},
	onSelectCandidate: function(obj,choice)
	{
		if(this.current_list) {
			var pos = this.current_pos + choice;
			if(pos < 0 || pos >= this.current_list.length) return false;
			this.SelectInternalCandidate(obj,pos);
			return true;
		}
		else return false;
	},
	onNextPage: function(obj)
	{
		if(this.current_list) {
			this.current_pos += 9;
			if(this.current_pos >= this.current_list.length) this.current_pos = 0;
			this.UpdateCandidate();
			return true;
		}
		else return false;
	},
	onPreviousPage: function(obj)
	{
		if(this.current_list) {
			this.current_pos -= 9;
			if(this.current_pos < 0) this.current_pos = this.current_list.length - this.current_list.length%9;
			this.UpdateCandidate();
			return true;
		}
		else return false;
	}
});
var RingBufferOutputModifier = OutputModifier.extend({
	size: null,

	start: 0,
	end: 0,
	buffer: [],
	constructor: function(ime,size)
	{
		this.base(ime);
		if(size) this.size = size+1;
		this.start = 0;
		this.end = 0;
	},
	ModifierName: function()
	{
		return 'RingBufferModifier';
	},
	GetBuffer: function()
	{
		var str;
		var i;

		str = '';
		i = this.start;
		while(i != this.end) {
			str += this.buffer[i++];
			if(i >= this.size) i = 0;
		}
		return str;
	},
	Modify: function(str)
	{
		this.buffer[this.end++] = str;
		if(this.end >= this.size) this.end = 0;
		if(this.end == this.start) this.start++;
		if(this.start >= this.size) this.start = 0;
		return str;
	}
});
var TimerOutputModifier = OutputModifier.extend({
	extdiv_id: '5c2dfee9-7fec-4c14-b7c8-789215860970',
	interval: 2000,
	last_time: 0,
	count: 0,
	extdiv: null,
	constructor: function(ime)
	{
		this.base(ime);
		// create an extension DIV
		this.extdiv = ime.mainwin.CreateExtensionDIV(this.extdiv_id,null,null,null,'');
		this.last_time = lib.time();
		this.SetOutputText()
	},
	SetOutputText: function()
	{
		if(this.extdiv) {
			var str;
			var t = parseFloat(lib.time() - this.last_time);

			if(t > 0) {
				var f = parseFloat(this.count)*1000/t;
				str = lib.sprintf("\u6253\u5b57\u901f\u5ea6: %.2f words/sec",f);
			}
			else str = "\u6253\u5b57\u901f\u5ea6: N/A";
			this.extdiv.innerHTML = str;
		}
	},
	ModifierName: function()
	{
		return "\u6253\u5b57\u8a08\u6642\u5668";
	},
	IsVisible: function()
	{
		return true;
	},
	Modify: function(str)
	{
		this.count++;
		var now = lib.time();

		if((now - this.last_time) > this.interval) {
			this.SetOutputText();
			this.count = 0;
			this.last_time = now;
		}
		return str;
	},
	Remove: function()
	{
		ime.mainwnd.DestroyExtensionDIV(this.extdiv_id);
	}
});
var UnicodeImageOutputModifier = OutputModifier.extend({
	constructor: function(ime)
	{
		this.base(ime);
	},
	ModifierName: function()
	{
		return 'UnicodeImageOutputModifier';
	},
	Modify: function(str)
	{
		var i,len,utf16;

		for(i=0;i<str.length;) {
			len = lib.utf16charlen(str.substr(i));
			utf16 = lib.chartoutf16(str.substr(i));
			Debug.trace(1,"UnicodeImageOutputModifier: u+%x <a href=\"http://www.unicode.org/cgi-bin/GetUnihanData.pl?codepoint=%x\"><img src=\"http://www.unicode.org/cgi-bin/refglyph?24-%x\" border=\"0\" /></a>",utf16,utf16,utf16);
			i += len;
		}
		return str;
	}
});
Debug.start();
