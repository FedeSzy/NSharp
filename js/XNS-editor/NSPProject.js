function Proyecto(data) {
	var _self = this;
	var _SIN_NOMBRE = "Proyecto sin título";
	var _SIN_AUTOR = "Sin autor";
	var _SIN_COM = "Sin comisión";

	var _VER = 0.5;

	var _version = 0;

	var _env = {
		"tea": false,
		"uid": null,
		"evs": null,
		"eve": null,
		"usr": _SIN_AUTOR,
		"com": _SIN_COM,
		"notify": null
	}
	var _defaults = {
		"usr": _SIN_AUTOR,
		"uid": null,
		"com": _SIN_COM,
		"sem": null,
		"ref": document.referrer,
		"url": document.location.href,
		"notify": null
	}

	var _data = null;

	var _name = _SIN_NOMBRE;
	var _dateStart = new Date();
	var _date = new Date();
	var _minutes = 0;
	var _evStart = null;
	var _evEnd = null;

	var _iem = false;

	var _diagrams = [];

	var _meta = null;
	var _log = null;

	function init() { resetData(); setData(data); setEnv(data); checkMEV(); starCheckTimer() }
	function checkMEV() {
		if (_env["evs"]) {
			if (_env["evs"].charAt(_env["evs"].length - 1) != "=") _env["evs"] += "=";
			_evStart = conv.toDate(_env["evs"]);
		}
		if (_env["eve"]) {
			if (_env["eve"].charAt(_env["eve"].length - 1) != "=") _env["eve"] += "=";
			_evEnd = conv.toDate(_env["eve"]);
		}
	}
	function starCheckTimer() {
		if (_evStart) {
			var now = new Date();
			var status = _evStart.valueOf() <= now.valueOf() && now.valueOf() <= _evEnd;
			if (status != _iem) {
				_iem = status;
				if (_env.notify) {
					_env.notify({ 'action': (_iem) ? 'refresh' : 'emchange' });
				}
			}
			window.setTimeout(starCheckTimer, 1000);
		}
	}
	function resetData() { _data = JSON.parse(JSON.stringify(_defaults)); }
	function setData(obj) { for (x in _data) if (obj[x]) _data[x] = obj[x]; }
	function setEnv(obj) { for (x in _env) if (obj[x]) _env[x] = obj[x]; }
	function addDiagram(d) { _diagrams.push(d); }
	function setDiagrams(l) {
		if (!(l instanceof Array) || l.length !== _diagrams.length) { return false; }
		for (var i = 0; i < l.length; i++) { if (_diagrams.indexOf(l[i]) === -1) { return false; } }
		_diagrams = l.slice();
		return true;
	}
	function moveDiagramUp(i) { permutar(_diagrams, i, i - 1); }
	function moveDiagramDown(i) { permutar(_diagrams, i, i + 1); }
	function cloneDiagram(i) {
		var d = _diagrams[i];
		var copia = new Metodo(d.theClass, d.name, d.code);
		_diagrams.splice(i + 1, 0, copia);
		return copia;
	}
	function deleteDiagram(id) {
		var pos = -1;
		var d = getDiagramById(id);
		if (d) {
			pos = _diagrams.indexOf(d);
			if (pos > -1) {
				_diagrams.splice(pos, 1);
			}
		}
		return pos;
	}
	function getDiagramById(id) {
		var d = null, i = 0;
		while (i < _diagrams.length && _diagrams[i].id != id) { i++ }
		if (i < _diagrams.length) { d = _diagrams[i]; }
		return d;
	}
	function getName() { return _name; }
	function setName(v) { _name = v || _SIN_NOMBRE; }
	function updateTime() {
		_date = new Date();
		_minutes = calculateMinutes(_date);
	}
	function calculateMinutes(actual) {
		var dif = actual.getTime() - _dateStart.getTime();
		return Math.trunc(dif / (1000 * 60));
	}
	function getForExport(completo, callback) {
		_date = new Date();
		if (callback) callback();
		updateTime();
		var obj = {
			...{ "name": _name, "diagrams": _diagrams },
			...((completo) ? { "usr": _env["usr"], "uid": _env["uid"], "com": _env["com"], "date": _date, "minutes": _minutes, "sem": (isEvalTime()) ? _env["evs"] : undefined } : {})
		};
		var sellos = new Sellos(_meta);
		sellos.add(getMetaInfo());
		obj.meta = sellos.data;
		var extra = (typeof clases != "undefined") ? clases.paraGuardar(_diagrams) : null;
		var dibujo = (typeof uml != "undefined") ? uml.guardar() : null;
		if (dibujo) {
			extra = extra || { v: 1 };
			extra.uml = dibujo;
		}
		if (extra) { obj.nsharp = extra; }
		return { "ver": _VER, "data": conv.fromJS(obj, true) };
	}
	function fillHistorial(popup) {
		if (!popup) return;
		function celda(txt, clase) {
			var s = document.createElement("span");
			s.className = clase;
			s.innerHTML = txt;
			return s;
		}
		var fila;
		if (_meta) {
			popup.innerHTML = "";
			if (_data && _data["sem"]) {
				fila = document.createElement("DIV");
				fila.className = "evalrow";
				fila.innerHTML = _data["com"] + " - Cierre: " + conv.toDate(_data["sem"]).toLocaleString();
				popup.appendChild(fila);
			}
			for (var i = 0; i < _log.length; i++) {
				fila = document.createElement("DIV");
				fila.className = "row";
				fila.appendChild(celda(_log[i].i.autor || _log[i].i.usr, "autor"));
				fila.appendChild(celda(new Date(_log[i].i.start).toLocaleString(), "date"));
				fila.appendChild(celda(new Date(_log[i].d).toLocaleString(), "date"));
				popup.appendChild(fila);
			}
		}
	}
	function importFromJSON(obj) {
		resetData();
		_version = obj["ver"] || 0.1;
		if (_version > 0.1) {
			obj = conv.toJS(obj["data"], true);
		}
		_name = obj.name;
		setData(obj);
		setMeta(obj.meta);
		if (isEvalTime() && !(isTeacher() || isMyFile(obj["autor"] || obj["usr"]))) throw "Invalid";
		obj.diagrams.forEach(d => { addDiagram(new Metodo(d.theClass, d.name, d.code)); });
		if (typeof clases != "undefined") { clases.desdeArchivo(obj["nsharp"], _diagrams); }
		if (typeof uml != "undefined") { uml.cargar(obj["nsharp"] ? obj["nsharp"].uml : null); }
	}
	function isMyFile(a) { return a == _env["usr"] }
	function setMeta(v) { _meta = v; _log = conv.toJS(_meta) }
	function getMeta() { return _meta }
	function getDiagramLength() { return _diagrams.length }
	function hasDiagrams() { return getDiagramLength() > 0 }
	function getResolutionTime() { if (!_minutes) updateTime(); return _minutes }

	function getFirst() { return (hasDiagrams) ? _diagrams[0] : null }
	function getDiagram(i) { return (_diagrams.length > i) ? _diagrams[i] : null }
	function publish(callback) { if (callback) _diagrams.forEach(d => { callback(d) }); }

	function getMetaInfo() {
		var mi = { "usr": _env["usr"], "com": _env["com"], "start": _dateStart.toISOString(), "minutes": _minutes };
		if (isEvalTime()) mi["sem"] = _env["evs"];
		return mi;
	}
	function getLog() { return _log }
	function getInfo(k) { return _env[k] }
	function getDateStr() { return _date.toLocaleString() }
	function isEvalTime() { return _iem }
	function isTeacher() { return _env["tea"] || (_env["uid"] && isNaN(_env["uid"])) }
	function getFullname() { return ((isEvalTime() && !isTeacher()) ? [_env["com"], _env["uid"], getName()] : [getName()]).join("_") }

	init();

	Object.defineProperty(_self, "meta", { "enumerable": true, "configurable": false, "get": getMeta, "set": setMeta });
	Object.defineProperty(_self, "name", { "enumerable": true, "configurable": false, "get": getName, "set": setName });
	Object.defineProperty(_self, "hasDiagrams", { "enumerable": true, "configurable": false, "get": hasDiagrams });
	Object.defineProperty(_self, "resolutionTime", { "enumerable": true, "configurable": false, "get": getResolutionTime });
	Object.defineProperty(_self, "et", { "enumerable": true, "configurable": false, "get": isEvalTime });
	Object.defineProperty(_self, "fullname", { "enumerable": true, "configurable": false, "get": getFullname });

	Object.defineProperty(_self, "updateTime", { "enumerable": false, "writable": false, "configurable": false, "value": updateTime })
	Object.defineProperty(_self, "moveDiagramUp", { "enumerable": false, "writable": false, "configurable": false, "value": moveDiagramUp })
	Object.defineProperty(_self, "moveDiagramDown", { "enumerable": false, "writable": false, "configurable": false, "value": moveDiagramDown })
	Object.defineProperty(_self, "diagramsCount", { "enumerable": false, "writable": false, "configurable": false, "value": getDiagramLength })
	Object.defineProperty(_self, "publishTo", { "enumerable": false, "writable": false, "configurable": false, "value": publish })
	Object.defineProperty(_self, "getFirst", { "enumerable": false, "writable": false, "configurable": false, "value": getFirst });
	Object.defineProperty(_self, "addDiagram", { "enumerable": false, "writable": false, "configurable": false, "value": addDiagram });
	Object.defineProperty(_self, "setDiagrams", { "enumerable": false, "writable": false, "configurable": false, "value": setDiagrams });
	Object.defineProperty(_self, "deleteDiagram", { "enumerable": false, "writable": false, "configurable": false, "value": deleteDiagram });
	Object.defineProperty(_self, "getDiagram", { "enumerable": false, "writable": false, "configurable": false, "value": getDiagram });
	Object.defineProperty(_self, "cloneDiagram", { "enumerable": false, "writable": false, "configurable": false, "value": cloneDiagram });
	Object.defineProperty(_self, "fillHistorial", { "enumerable": false, "writable": false, "configurable": false, "value": fillHistorial });
	Object.defineProperty(_self, "getForExport", { "enumerable": false, "writable": false, "configurable": false, "value": getForExport });
	Object.defineProperty(_self, "getLog", { "enumerable": false, "writable": false, "configurable": false, "value": getLog });
	Object.defineProperty(_self, "getInfo", { "enumerable": false, "writable": false, "configurable": false, "value": getInfo });
	Object.defineProperty(_self, "getDateStr", { "enumerable": false, "writable": false, "configurable": false, "value": getDateStr });
	Object.defineProperty(_self, "import", { "enumerable": false, "writable": false, "configurable": false, "value": importFromJSON });
	Object.defineProperty(_self, "set", { "enumerable": false, "writable": false, "configurable": false, "value": setData });

	return _self;
}
