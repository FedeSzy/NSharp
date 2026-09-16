var metodos = (function () {
	var o = {};

	var CAMPOS = {
		clase: ".class-name",
		nombre: ".method-name",
		tipo: ".method-type",
		vis: ".method-modifiers"
	};
	var FIRMA = "nsharp-methods";

	function empaquetarParaSistema(l) {
    return l.map(function (d) {
        return { clase: d.theClass || "", nombre: d.name || "", code: d.code };
    });
	}

	function copiarAlSistema(l) {
    if (!l || !l.length || !navigator.clipboard || !navigator.clipboard.writeText) { return false; }
    try {
        navigator.clipboard.writeText(JSON.stringify({ tag: FIRMA, methods: empaquetarParaSistema(l) })).catch(function () { });
    } catch (e) { return false; }
    return true;
	}

	function lista() {
		var r = [];
		if (typeof proy !== "undefined" && proy) { proy.publishTo(function (d) { r.push(d); }); }
		return r;
	}

	function ordenar(l) {
		if (typeof proy !== "undefined" && proy && proy.setDiagrams) { proy.setDiagrams(l); }
	}

	function posicionDe(d) { return lista().indexOf(d); }

	function porId(id) {
		var r = null;
		lista().forEach(function (d) { if (d.id === id) { r = d; } });
		return r;
	}

	function esActivo(d) { return typeof lienzo !== "undefined" && lienzo.actualDiagram === d; }

	function rotulo(d) { return (d.name || "sin nombre") + "()"; }

	function claseDe(d) { return d.theClass || ""; }

	function parchar(code, ruta, valor) {
		var caja = document.createElement("div");
		caja.innerHTML = code;
		var i = caja.querySelector(ruta + ">.input-for-statement");
		if (!i) { return code; }
		i.setAttribute("value", valor);
		i.style.width = (valor.length + 0.5) + "ch";
		return caja.innerHTML;
	}

	function renombrar(d, datos) {
		if (!d) { return; }
		if (esActivo(d)) {
			Object.keys(CAMPOS).forEach(function (k) {
				if (typeof datos[k] !== "string") { return; }
				var i = document.querySelector("#actualDiagram " + CAMPOS[k] + ">.input-for-statement");
				if (!i) { return; }
				i.value = datos[k];
				i.setAttribute("value", datos[k]);
				medirCampo(i);
			});
			actualizarDiagrama();
			return;
		}
		var code = d.code;
		Object.keys(CAMPOS).forEach(function (k) {
			if (typeof datos[k] !== "string") { return; }
			code = parchar(code, CAMPOS[k], datos[k]);
		});
		if (typeof datos.clase === "string") { d.theClass = datos.clase; }
		if (typeof datos.nombre === "string") { d.name = datos.nombre; }
		d.code = code;
	}

	function cuantosBloques(d) {
		if (!d || !d.code) { return 0; }
		var caja = document.createElement("div");
		caja.innerHTML = d.code;
		var n = 0;
		Array.prototype.forEach.call(caja.querySelectorAll('[draggable="true"]'), function (b) {
			if (util.esBloque(b)) { n++; }
		});
		return n;
	}

	function codigoNuevo(clase, vis, tipo, nombre, params) {
		var caja = document.createElement("div");
		dibujarDiagrama(caja, {
			declaration: { "class": clase, modifiers: vis, type: tipo, name: nombre, arguments: [] },
			localVars: [],
			statements: []
		});
		var zona = caja.querySelector(".method-parameters");
		if (zona && params) {
			params.forEach(function (p, i) {
				var el = fabrica["newParameter"]({ type: p.tipo, name: p.nombre });
				hacerArrastrable(el);
				if (i > 0) { el.innerHTML = " , " + el.innerHTML; }
				zona.appendChild(el);
			});
		}
		caja.lastChild.appendChild(hueco());
		return util.htmlLimpio(caja);
	}

	function nombreClase(cid) {
		var c = cid ? clases.porId(cid) : null;
		var n = c ? (c.name || "").trim() : "";
		return n || null;
	}

	function aplicarClase(d) {
		var n = nombreClase(clases.claseDeMetodo(d.id));
		if (!n || d.theClass === n) { return false; }
		renombrar(d, { clase: n });
		return true;
	}

	function sincronizarClase(cid) {
		var n = nombreClase(cid);
		if (!n) { return 0; }
		var tocados = 0;
		lista().forEach(function (d) {
			if (clases.claseDeMetodo(d.id) === cid && d.theClass !== n) {
				renombrar(d, { clase: n });
				tocados++;
			}
		});
		return tocados;
	}

	function reordenar() {
		var hay = lista();
		var fin = [];
		function bajar(pid) {
			clases.hijas(pid).forEach(function (c) { bajar(c.id); });
			hay.forEach(function (d) {
				if (clases.claseDeMetodo(d.id) === pid && fin.indexOf(d) === -1) { fin.push(d); }
			});
		}
		bajar(null);
		hay.forEach(function (d) { if (fin.indexOf(d) === -1) { fin.push(d); } });
		ordenar(fin);
		return fin;
	}

	function mover(d, cid, antesDe) {
		var l = lista();
		var de = l.indexOf(d);
		if (de === -1) { return; }
		l.splice(de, 1);
		clases.asignarA(d.id, cid);
		var a = antesDe ? l.indexOf(antesDe) : -1;
		if (a === -1) { a = l.length; }
		l.splice(a, 0, d);
		ordenar(l);
		reordenar();
		aplicarClase(d);
	}

	function correr(d, paso) {
		var l = lista();
		var de = l.indexOf(d);
		var a = de + paso;
		if (de === -1 || a < 0 || a >= l.length) { return false; }
		l.splice(de, 1);
		l.splice(a, 0, d);
		var vecino = l[a + (paso > 0 ? -1 : 1)];
		if (vecino) { clases.asignarA(d.id, clases.claseDeMetodo(vecino.id)); }
		ordenar(l);
		return true;
	}

	o.lista = lista;
	o.ordenar = ordenar;
	o.posicionDe = posicionDe;
	o.porId = porId;
	o.esActivo = esActivo;
	o.rotulo = rotulo;
	o.claseDe = claseDe;
	o.renombrar = renombrar;
	o.cuantosBloques = cuantosBloques;
	o.codigoNuevo = codigoNuevo;
	o.nombreClase = nombreClase;
	o.aplicarClase = aplicarClase;
	o.sincronizarClase = sincronizarClase;
	o.reordenar = reordenar;
	o.mover = mover;
	o.correr = correr;
	o.copiarAlSistema = copiarAlSistema;
	o.FIRMA = FIRMA;

	return o;
}());
