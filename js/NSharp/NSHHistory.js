var historial = (function () {
	var o = {};
	var TOPE = 120;

	var pilas = {};
	var volviendo = false;
	var prendido = false;

	function pilaDe(d) {
		if (!d) { return null; }
		if (!pilas[d.id]) { pilas[d.id] = { atras: [], adelante: [], ahora: null }; }
		return pilas[d.id];
	}

	function pila() {
		return (typeof lienzo !== "undefined") ? pilaDe(lienzo.actualDiagram) : null;
	}

	function foto() { return util.htmlLimpio(util.zonaDiagrama()); }

	function reset(d) {
		var p = pilaDe(d);
		if (!p) { return; }
		p.atras.length = 0;
		p.adelante.length = 0;
		p.ahora = foto();
		pintarBotones();
	}

	function anotar() {
		if (!prendido || volviendo) { return; }
		var p = pila();
		if (!p) { return; }
		var html = foto();
		if (p.ahora === null) {
			p.ahora = html;
			pintarBotones();
			return;
		}
		if (html === p.ahora) { return; }
		p.atras.push(p.ahora);
		if (p.atras.length > TOPE) { p.atras.shift(); }
		p.adelante.length = 0;
		p.ahora = html;
		util.marcarCambios();
		pintarBotones();
	}

	function poner(html) {
		volviendo = true;
		try {
			lienzo.container.innerHTML = html;
			lienzo.reAssignEvents();
			lienzo.refresh();
			if (typeof arbol !== "undefined") { arbol.actualizar(lienzo.actualDiagram); }
		} finally {
			volviendo = false;
		}
		pintarBotones();
	}

	function atras() {
		var p = pila();
		if (!p || !p.atras.length) {
			util.aviso("No hay cambios para deshacer");
			return false;
		}
		util.marcarCambios();
		var vivo = foto();
		if (vivo !== p.ahora) {
			p.atras.push(p.ahora);
			p.ahora = vivo;
		}
		p.adelante.push(p.ahora);
		p.ahora = p.atras.pop();
		poner(p.ahora);
		return true;
	}

	function adelante() {
		var p = pila();
		if (!p || !p.adelante.length) {
			util.aviso("No hay cambios para rehacer");
			return false;
		}
		util.marcarCambios();
		p.atras.push(p.ahora);
		p.ahora = p.adelante.pop();
		poner(p.ahora);
		return true;
	}

	function hayAtras() {
		var p = pila();
		return !!(p && p.atras.length);
	}

	function hayAdelante() {
		var p = pila();
		return !!(p && p.adelante.length);
	}

	function olvidar(id) { delete pilas[id]; }

	function limpiarTodo() {
		pilas = {};
		pintarBotones();
	}

	function pintarBotones() {
		// En la vista UML los mismos botones muestran el historial del UML.
		if (typeof uml !== "undefined" && uml.activo()) { return; }
		var a = document.getElementById("nshUndoBtn");
		var b = document.getElementById("nshRedoBtn");
		if (a) { a.disabled = !hayAtras(); }
		if (b) { b.disabled = !hayAdelante(); }
	}

	function iniciar() {
		prendido = true;
		reset(lienzo.actualDiagram);
	}

	o.reset = reset;
	o.anotar = anotar;
	o.atras = atras;
	o.adelante = adelante;
	o.hayAtras = hayAtras;
	o.hayAdelante = hayAdelante;
	o.olvidar = olvidar;
	o.limpiarTodo = limpiarTodo;
	o.pintarBotones = pintarBotones;
	o.iniciar = iniciar;
	o.volviendo = function () { return volviendo; };

	return o;
}());
