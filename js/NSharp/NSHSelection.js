var seleccion = (function () {
	var o = {};

	var elegidos = [];
	var ancla = null;
	var clip = [];
	var pegaPendiente = false;

	var FIRMA = "nsharp-blocks";

	function items() { return elegidos.slice(); }

	function cuantos() { return elegidos.length; }

	function tiene(b) { return elegidos.indexOf(b) !== -1; }

	function vacia() { return elegidos.length === 0; }

	function enOrden() {
		return elegidos.slice().sort(function (a, b) {
			var p = a.compareDocumentPosition(b);
			if (p & Node.DOCUMENT_POSITION_FOLLOWING) { return -1; }
			if (p & Node.DOCUMENT_POSITION_PRECEDING) { return 1; }
			return 0;
		});
	}

	function padres() {
		var l = enOrden();
		return l.filter(function (b) {
			return !l.some(function (x) { return x !== b && x.contains(b); });
		});
	}

	function podar() {
		var antes = elegidos.length;
		elegidos = elegidos.filter(function (b) { return b.isConnected; });
		if (elegidos.length !== antes) { ancla = elegidos[elegidos.length - 1] || null; }
	}

	function pintar() {
		podar();
		util.qq("#actualDiagram .nsh-selected").forEach(function (el) {
			if (elegidos.indexOf(el) === -1) { el.classList.remove("nsh-selected"); }
		});
		elegidos.forEach(function (el) { el.classList.add("nsh-selected"); });
		document.body.classList.toggle("nsh-show-checks",
			elegidos.length > 0 || document.body.classList.contains("nsh-force-checks"));
	}

	function limpiarSeleccion() {
		elegidos = [];
		ancla = null;
		pintar();
	}

	function poner(l) {
		if (l.length && typeof arbol !== "undefined" && arbol.limpiarSeleccion) { arbol.limpiarSeleccion(); }
		elegidos = l.filter(Boolean);
		ancla = elegidos[elegidos.length - 1] || null;
		pintar();
	}

	function agregar(b) {
		if (!b || tiene(b)) { return; }
		if (typeof arbol !== "undefined" && arbol.limpiarSeleccion) { arbol.limpiarSeleccion(); }
		elegidos.push(b);
		ancla = b;
		pintar();
	}

	function sacar(b) {
		var i = elegidos.indexOf(b);
		if (i !== -1) {
			elegidos.splice(i, 1);
			pintar();
		}
	}

	function tocar(b) { if (tiene(b)) { sacar(b); } else { agregar(b); } }

	function soloEste(b) { poner(b ? [b] : []); }

	function rango(b) {
		if (!ancla || !ancla.isConnected || ancla === b) { soloEste(b); return; }
		var todo = util.bloques();
		var de = todo.indexOf(ancla), a = todo.indexOf(b);
		if (de === -1 || a === -1) { soloEste(b); return; }
		if (de > a) { var x = de; de = a; a = x; }
		var tajada = todo.slice(de, a + 1);
		var viejo = ancla;
		poner(tajada.filter(function (el) {
			return !tajada.some(function (otro) { return otro !== el && otro.contains(el); });
		}));
		ancla = viejo;
	}

	function todos() {
		poner(util.bloques());
		util.aviso(cuantos() === 1 ? "Se seleccionó 1 bloque" : "Se seleccionaron " + cuantos() + " bloques");
	}

	function ponerCasillas() {
		util.bloques().forEach(function (b) {
			var hay = false;
			for (var i = 0; i < b.children.length; i++) {
				if (b.children[i].classList.contains("nsh-check")) { hay = true; break; }
			}
			if (!hay) {
				var t = document.createElement("span");
				t.className = "nsh-ui nsh-check";
				t.setAttribute("title", "Seleccionar este bloque");
				b.appendChild(t);
			}
		});
	}

	function meterEn(hh, paso) {
		if (!hh || !hh.parentNode) { return false; }
		var p = hh.parentNode;
		p.insertBefore(paso, hh);
		p.insertBefore(hueco(), paso);
		return true;
	}

	function huecoFinal() {
		if (!util.hayMetodo()) { return null; }
		var raiz = util.q("#actualDiagram > .statements") || util.zonaDiagrama();
		if (!raiz) { return null; }
		var libres = Array.prototype.filter.call(raiz.children, function (h) {
			return h.classList && h.classList.contains("empty");
		});
		if (libres.length) { return libres[libres.length - 1]; }
		var h = hueco();
		raiz.appendChild(h);
		return h;
	}

	function huecoCerca() {
		var l = enOrden();
		for (var i = l.length - 1; i >= 0; i--) {
			var sig = l[i].nextSibling;
			if (sig && sig.classList && sig.classList.contains("empty")) { return sig; }
		}
		return huecoFinal();
	}

	function quitarBloque(b) {
		if (!b || !b.parentNode) { return; }
		if (util.esBloque(b)) {
			var sig = b.nextSibling;
			if (sig && sig.classList && sig.classList.contains("empty")) { sig.parentNode.removeChild(sig); }
		}
		b.parentNode.removeChild(b);
	}

	function comas() {
		var zona = (typeof lienzo !== "undefined") ? lienzo.methodParameters : null;
		if (!zona) { return; }
		Array.prototype.forEach.call(zona.children, function (p, i) {
			var pri = p.firstChild;
			var hay = pri && pri.nodeType === 3 && pri.textContent.indexOf(",") !== -1;
			if (i === 0 && hay) {
				p.removeChild(pri);
			} else if (i > 0 && !hay) {
				p.insertBefore(document.createTextNode(" , "), pri);
			}
		});
	}

	function eliminarElegidos(callado) {
		if (vacia()) { return false; }
		var l = padres();
		l.forEach(quitarBloque);
		limpiarSeleccion();
		comas();
		refrescarLienzo();
		if (!callado) {
			util.aviso(l.length === 1 ? "Se eliminó el bloque" : "Se eliminaron " + l.length + " bloques");
		}
		return true;
	}

	function refrescarLienzo() {
		lienzo.reAssignEvents();
		actualizarDiagrama();
	}

	function empaquetar(l) {
		return l.map(function (b) {
			var caja = document.createElement("div");
			caja.appendChild(b.cloneNode(true));
			return util.htmlLimpio(caja);
		});
	}

	function alSistema(carga) {
		if (!navigator.clipboard || !navigator.clipboard.writeText) { return; }
		try {
			navigator.clipboard.writeText(JSON.stringify({ tag: FIRMA, blocks: carga })).catch(function () { });
		} catch (e) { }
	}

	function copiar(callado) {
		if (vacia()) {
			if (!callado) { util.aviso("Elegí al menos un bloque para copiar"); }
			return false;
		}
		clip = empaquetar(padres());
		alSistema(clip);
		if (!callado) {
			util.aviso(clip.length === 1 ? "Se copió el bloque" : "Se copiaron " + clip.length + " bloques");
		}
		return true;
	}

	function cortar() {
		if (!copiar(true)) {
			util.aviso("Elegí al menos un bloque para cortar");
			return false;
		}
		var n = cuantos();
		eliminarElegidos(true);
		util.aviso(n === 1 ? "Se cortó el bloque" : "Se cortaron " + n + " bloques");
		return true;
	}

	function meterLista(l, hh) {
		if (!l || !l.length) { return []; }
		var destino = hh || huecoCerca();
		var puestos = [];
		l.forEach(function (html) {
			util.aNodos(html).forEach(function (n) {
				if (n.nodeType !== 1) { return; }
				hacerArrastrable(n);
				var k = util.tipoDeclaracion(n);
				if (k) {
					var casa = util.zonaDeclaracion(k);
					if (casa) { casa.appendChild(n); puestos.push(n); }
					return;
				}
				if (destino && meterEn(destino, n)) { puestos.push(n); }
			});
		});
		comas();
		return puestos;
	}

	function pegar(hh) {
		if (!clip.length) {
			util.aviso("No hay bloques copiados todavía");
			return false;
		}
		if (!util.hayMetodo()) {
			util.aviso("Abrí un método antes de pegar bloques");
			return false;
		}
		var puestos = meterLista(clip, hh);
		if (!puestos.length) { return false; }
		refrescarLienzo();
		poner(puestos.filter(function (n) { return n.isConnected; }));
		util.aviso(puestos.length === 1 ? "Se pegó el bloque" : "Se pegaron " + puestos.length + " bloques");
		return true;
	}

	function duplicar() {
		if (vacia()) { return false; }
		var puestos = meterLista(empaquetar(padres()), huecoCerca());
		if (!puestos.length) { return false; }
		refrescarLienzo();
		poner(puestos);
		util.aviso(puestos.length === 1 ? "Se duplicó el bloque" : "Se duplicaron " + puestos.length + " bloques");
		return true;
	}

	function hayPortapapeles() { return clip.length > 0; }

	function pedirPegar(hh) {
		pegaPendiente = { hueco: hh || null };
		window.setTimeout(function () {
			if (pegaPendiente) {
				pegaPendiente = null;
				pegar(hh);
			}
		}, 0);
	}

	function pegaDelSistema(e) {
		if (util.escribiendo(e.target)) { return; }
		var txt = e.clipboardData ? e.clipboardData.getData("text/plain") : "";
		var carga = null;
		try {
			var j = JSON.parse(txt);
			if (j && j.tag === FIRMA && j.blocks instanceof Array) { carga = j.blocks; }
		} catch (x) {
			carga = null;
		}
		if (!carga) { return; }
		e.preventDefault();
		clip = carga;
		var hh = pegaPendiente ? pegaPendiente.hueco : null;
		pegaPendiente = null;
		pegar(hh);
	}

	function alTilde(e) {
		var t = e.target.classList && e.target.classList.contains("nsh-check") ? e.target : null;
		if (!t) { return false; }
		e.preventDefault();
		e.stopPropagation();
		if (e.shiftKey) { rango(t.parentNode); } else { tocar(t.parentNode); }
		return true;
	}

	function alClick(e) {
		if (typeof arrastre !== "undefined" && arrastre.huboArrastre()) { return; }
		if (e.target.classList && e.target.classList.contains("nsh-check")) { return; }
		var b = util.bloqueDe(e.target);
		if (e.ctrlKey || e.metaKey) {
			if (b) { e.preventDefault(); tocar(b); }
			return;
		}
		if (e.shiftKey) {
			if (b) { e.preventDefault(); rango(b); }
			return;
		}
		if (util.escribiendo(e.target) || !b) {
			limpiarSeleccion();
			return;
		}
		if (util.focoEnCampoVacio(e.target)) {
			soloEste(b);
			return;
		}
		soloEste(b);
	}

	function iniciar() {
		var zonaDiagrama = util.zonaDiagrama();
		if (!zonaDiagrama) { return; }
		zonaDiagrama.addEventListener("click", alClick);
		zonaDiagrama.addEventListener("pointerdown", alTilde, true);
		document.addEventListener("paste", pegaDelSistema);
		var marco = document.getElementById("nshCanvas");
		if (marco) {
			marco.addEventListener("click", function (e) {
				if (e.target === marco && !(typeof arrastre !== "undefined" && arrastre.huboArrastre())) { limpiarSeleccion(); }
			});
		}
	}

	o.items = items;
	o.cuantos = cuantos;
	o.tiene = tiene;
	o.vacia = vacia;
	o.enOrden = enOrden;
	o.padres = padres;
	o.podar = podar;
	o.comas = comas;
	o.limpiarSeleccion = limpiarSeleccion;
	o.poner = poner;
	o.agregar = agregar;
	o.sacar = sacar;
	o.tocar = tocar;
	o.soloEste = soloEste;
	o.todos = todos;
	o.pintar = pintar;
	o.ponerCasillas = ponerCasillas;
	o.meterEn = meterEn;
	o.huecoFinal = huecoFinal;
	o.huecoCerca = huecoCerca;
	o.quitarBloque = quitarBloque;
	o.eliminarElegidos = eliminarElegidos;
	o.refrescarLienzo = refrescarLienzo;
	o.copiar = copiar;
	o.cortar = cortar;
	o.pegar = pegar;
	o.pedirPegar = pedirPegar;
	o.duplicar = duplicar;
	o.hayPortapapeles = hayPortapapeles;
	o.iniciar = iniciar;

	return o;
}());
