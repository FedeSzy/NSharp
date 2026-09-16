var conv = new function () {
	var _ref = this;

	function fromJS(data, alReves) {
		var salida = aB64(JSON.stringify(data || {}));
		return (alReves) ? salida.split("").reverse().join("") : salida;
	}
	function toJS(txt, alReves) {
		var salida = null;
		try {
			salida = JSON.parse(deB64((alReves) ? txt.split("").reverse().join("") : txt));
		} catch (e) {
			console.log(e.message);
		}
		return salida;
	}
	function aB64(txt) {
		return btoa(unescape(encodeURIComponent(txt)));
	}
	function deB64(txt) {
		return decodeURIComponent(escape(atob(txt)));
	}
	function getDateCode(x) {
		if (!(x && x instanceof Date)) x = new Date(1);
		return aB64(x);
	}
	function toDate(d) {
		return (!d) ? null : new Date(deB64(d));
	}
	Object.defineProperty(_ref, 'fromJS', { "configurable": false, "writable": false, "value": fromJS });
	Object.defineProperty(_ref, 'toJS', { "configurable": false, "writable": false, "value": toJS });
	Object.defineProperty(_ref, 'getDateCode', { "configurable": false, "writable": false, "value": getDateCode });
	Object.defineProperty(_ref, 'toDate', { "configurable": false, "writable": false, "value": toDate });
	return _ref;
}

var Sellos = function () {
	var _ref = this;
	var _obj = [];
	function add(info) {
		_obj.push({ 'd': new Date().toISOString(), 'i': info });
	}
	function setData(data) {
		if (data instanceof Array) {
			_obj = data;
		} else if (!!data) {
			_obj = conv.toJS(data);
		}
	}
	function getData() {
		return conv.fromJS(_obj);
	}
	function getObject() {
		return _obj;
	}
	Object.defineProperty(_ref, 'add', { "configurable": false, "writable": false, "value": add });
	Object.defineProperty(_ref, 'data', { "enumerable": true, "configurable": false, "get": function () { return getData() }, "set": function (x) { setData(x) } });
	Object.defineProperty(_ref, 'object', { "enumerable": true, "configurable": false, "get": function () { return getObject() } });
	if (arguments.length == 1) {
		setData(arguments[0]);
	}
	return _ref;
}

var Globo = function () {
	var _ref = this;
	var _elems = {
		"button": null,
		"popup": null
	}
	var _events = {
		"open": null,
		"close": null
	}
	var _timer = null;
	var _visible = false;
	function init(params) {
		copiar(params, _elems);
		copiar(params, _events);
		if (params.visible != undefined) _visible = params.visible;
		if (_elems.button && _elems.popup) {
			enganchar(_elems.button, "click", alClick);
			enganchar(_elems.popup, "mouseenter", encima);
			enganchar(_elems.popup, "mouseleave", afuera);
		}
	}
	function copiar(origen, destino) {
		for (x in destino) { if (origen[x]) destino[x] = origen[x]; }
	}
	function alClick() {
		_visible = !_visible;
		var accion = _events[(_visible) ? "open" : "close"];
		if (accion) accion(_elems);
		alternarClase(_elems.popup, "hidden");
		((_visible) ? arrancarTimer : pararTimer)();
	}
	function cerrar() {
		if (_visible) alClick();
	}
	function encima() {
		event.stopPropagation();
		if (_timer) pararTimer();
	}
	function afuera() {
		event.stopPropagation();
		if (!_timer) arrancarTimer();
	}
	function arrancarTimer() {
		_timer = window.setTimeout(cerrar, 2000);
	}
	function pararTimer() {
		window.clearTimeout(_timer);
		_timer = null;
	}
	init(arguments[0]);
	return _ref;
}
