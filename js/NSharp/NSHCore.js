var util = (function () {
	var o = {};

	var PREF = "nsh-";
	var VOLATIL = ["empty-hover", "expand-empty", "trash-over"];
	var ANCHOS = ".block-statement,.input-statement,.output-statement,.call-statement,.return-statement,.comment-statement";
	var TIT = "NS Sharp - Editor de diagramas de Nassi-Shneiderman";

	var PISTAS = [
		[".class-name", "Clase"],
		[".method-modifiers", "visibilidad"],
		[".method-type", "tipo"],
		[".method-name", "nombre"],
		[".parameter-declaration .type,.variable-declaration .type,.initialized-variable-declaration>.type", "tipo"],
		[".parameter-declaration .name,.variable-declaration .name", "nombre"],
		[".condition", "condición"],
		[".test-value", "valor"],
		[".input-statement", "variable"],
		[".output-statement", "expresión"],
		[".call-statement", "función(parámetros)"],
		[".return-statement", "expresión"],
		[".comment-statement", "comentario"],
		[".block-statement", "instrucción"]
	];

	var sucio = false;

	o.listo = false;
	o.alPintar = function () { };

	function q(s, r) { return (r || document).querySelector(s); }

	function qq(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

	function zonaDiagrama() { return document.getElementById("actualDiagram"); }

	function hayMetodo() { return typeof lienzo !== "undefined" && !!lienzo.actualDiagram; }

	function arrastrables() { return qq("#actualDiagram [draggable=\"true\"]"); }

	function bloques() { return arrastrables().filter(esBloque); }

	function esBloque(el) { return !!el && el.className.indexOf("declaration") === -1; }

	function tipoDeclaracion(el) {
		if (!el || typeof el.className !== "string") { return null; }
		if (el.className.indexOf("parameter-declaration") !== -1) { return "parameter"; }
		if (el.className.indexOf("variable-declaration") !== -1 ||
			el.className.indexOf("initialized-variable-declaration") !== -1) { return "local"; }
		return null;
	}

	function esDeclaracion(el) { return tipoDeclaracion(el) !== null; }

	function zonaDeclaracion(k) {
		if (typeof lienzo === "undefined") { return null; }
		return (k === "parameter") ? lienzo.methodParameters : lienzo.localVars;
	}

	function acomodarDeclaraciones() {
		if (!zonaDiagrama()) { return 0; }
		var n = 0;
		arrastrables().forEach(function (b) {
			var k = tipoDeclaracion(b);
			if (!k) { return; }
			var casa = zonaDeclaracion(k);
			if (!casa || b.parentNode === casa) { return; }
			var sig = b.nextSibling;
			if (sig && sig.classList && sig.classList.contains("empty")) { sig.parentNode.removeChild(sig); }
			casa.appendChild(b);
			n++;
		});
		return n;
	}

	function bloqueDe(el) {
		var n = el, raiz = zonaDiagrama();
		while (n && n !== raiz) {
			if (n.getAttribute && n.getAttribute("draggable") === "true") { return n; }
			n = n.parentNode;
		}
		return null;
	}

	function volcarCampos(r) {
		qq(".input-for-statement", r || document).forEach(function (i) { i.setAttribute("value", i.value); });
	}

	function sacarClases(el) {
		if (!el.className || typeof el.className !== "string") { return; }
		var quedan = el.className.split(/\s+/).filter(function (c) {
			return c && c.indexOf(PREF) !== 0 && VOLATIL.indexOf(c) === -1;
		});
		if (quedan.length) { el.className = quedan.join(" "); } else { el.removeAttribute("class"); }
	}

	function htmlLimpio(r) {
		var orig = r || zonaDiagrama();
		if (!orig) { return ""; }
		volcarCampos(orig);
		var copia = orig.cloneNode(true);
		qq(".nsh-ui", copia).forEach(function (n) { if (n.parentNode) { n.parentNode.removeChild(n); } });
		qq("*", copia).forEach(function (el) {
			sacarClases(el);
			Array.prototype.slice.call(el.attributes).forEach(function (a) {
				if (a.name.indexOf("data-nsh") === 0) { el.removeAttribute(a.name); }
			});
			el.removeAttribute("placeholder");
			el.removeAttribute("title");
		});
		return copia.innerHTML;
	}

	function aNodos(html) {
		var caja = document.createElement("div");
		caja.innerHTML = html;
		return Array.prototype.slice.call(caja.childNodes);
	}

	function textoDeAyuda(i) {
		for (var x = 0; x < PISTAS.length; x++) {
			if (i.closest(PISTAS[x][0])) { return PISTAS[x][1]; }
		}
		return "completar...";
	}

	function marcarVacios(r) {
		var z = r || zonaDiagrama();
		if (!z) { return; }
		qq(".nsh-has-empty", z).forEach(function (el) { el.classList.remove("nsh-has-empty"); });
		qq(".input-for-statement", z).forEach(function (i) {
			var vacio = i.value.length === 0;
			i.classList.toggle("nsh-empty-input", vacio);
			if (vacio) {
				i.setAttribute("placeholder", textoDeAyuda(i));
				var casa = i.closest(ANCHOS) || i.parentNode;
				if (casa && casa !== z) { casa.classList.add("nsh-has-empty"); }
			} else {
				i.removeAttribute("placeholder");
			}
		});
	}

	function estaVacio(b) {
		var todo = qq(".input-for-statement", b);
		return todo.length > 0 && todo.every(function (i) { return (i.value || "").trim() === ""; });
	}

	function focoEnCampoVacio(t) {
		if (!t || t.tagName === "INPUT") { return false; }
		var casa = t.closest ? t.closest(".nsh-has-empty") : null;
		if (!casa) { casa = bloqueDe(t); }
		if (!casa) { return false; }
		var libres = qq(".nsh-empty-input", casa);
		if (!libres.length) { return false; }
		libres[0].focus();
		return true;
	}

	function actualizarTitulo() {
		var n = (typeof proy !== "undefined" && proy) ? (proy.name || "").trim() : "";
		document.title = (!n || n === "Proyecto sin título") ? TIT : n + " - NS Sharp";
	}

	function aviso(txt, ms) {
		var casa = document.getElementById("nshToasts");
		if (!casa) { return; }
		var el = document.createElement("div");
		el.className = "nsh-toast";
		el.textContent = txt;
		casa.appendChild(el);
		window.setTimeout(function () {
			el.classList.add("nsh-toast-out");
			window.setTimeout(function () { if (el.parentNode) { el.parentNode.removeChild(el); } }, 260);
		}, ms || 1900);
	}

	function pintarSucio() {
		var bt = document.getElementById("exportProjectBtn");
		if (!bt) { return; }
		bt.classList.toggle("nsh-unsaved", sucio);
		bt.title = sucio
			? "Hay cambios sin guardar - Guardar como .nsplus (Ctrl+S)"
			: "Guardar como .nsplus (Ctrl+S)";
	}

	function marcarCambios() {
		if (sucio) { return; }
		sucio = true;
		pintarSucio();
	}

	function marcarGuardado() {
		sucio = false;
		pintarSucio();
	}

	function hayCambios() { return sucio; }

	function escribiendo(el) {
		if (!el) { return false; }
		var t = el.tagName;
		return t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || el.isContentEditable;
	}

	function nuevoId(p) { return (p || "id") + "-" + Math.random().toString(36).slice(2, 9); }

	function retrasar(fn, ms) {
		var t = null;
		return function () {
			var args = arguments, yo = this;
			window.clearTimeout(t);
			t = window.setTimeout(function () { fn.apply(yo, args); }, ms);
		};
	}

	function sinAcentos(txt) {
		return (txt || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
	}

	o.q = q;
	o.qq = qq;
	o.zonaDiagrama = zonaDiagrama;
	o.hayMetodo = hayMetodo;
	o.arrastrables = arrastrables;
	o.bloques = bloques;
	o.esBloque = esBloque;
	o.tipoDeclaracion = tipoDeclaracion;
	o.esDeclaracion = esDeclaracion;
	o.zonaDeclaracion = zonaDeclaracion;
	o.acomodarDeclaraciones = acomodarDeclaraciones;
	o.bloqueDe = bloqueDe;
	o.volcarCampos = volcarCampos;
	o.htmlLimpio = htmlLimpio;
	o.aNodos = aNodos;
	o.marcarVacios = marcarVacios;
	o.textoDeAyuda = textoDeAyuda;
	o.estaVacio = estaVacio;
	o.focoEnCampoVacio = focoEnCampoVacio;
	o.actualizarTitulo = actualizarTitulo;
	o.aviso = aviso;
	o.marcarCambios = marcarCambios;
	o.marcarGuardado = marcarGuardado;
	o.hayCambios = hayCambios;
	o.escribiendo = escribiendo;
	o.nuevoId = nuevoId;
	o.retrasar = retrasar;
	o.sinAcentos = sinAcentos;

	return o;
}());
