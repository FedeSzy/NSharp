var arrastre = (function () {
	var o = {};
	var MINIMO = 6;

	var viaje = null;
	var fantasma = null;
	var raya = null;
	var recien = false;

	function esHueco(n) { return !!(n && n.classList && n.classList.contains("empty")); }

	function subir(n, ok, tope) {
		while (n && n !== tope) {
			if (n.nodeType === 1 && ok(n)) { return n; }
			n = n.parentNode;
		}
		return null;
	}

	function tacho() { return document.getElementById("trash"); }

	function adentroDe(n, l) {
		return l.some(function (b) { return b === n || b.contains(n); });
	}

	function destinoDecl(x, y, k, l) {
		var casa = util.zonaDeclaracion(k);
		if (!casa) { return null; }
		var el = document.elementFromPoint(x, y);
		if (!el || !casa.contains(el)) { return null; }
		var hermano = subir(el, function (n) {
			return n.parentNode === casa && util.tipoDeclaracion(n) === k;
		}, casa.parentNode);

		if (!hermano || adentroDe(hermano, l)) { return { casa: casa, antes: null }; }
		var r = hermano.getBoundingClientRect();
		return { casa: casa, antes: (x < r.left + r.width / 2) ? hermano : hermano.nextElementSibling };
	}

	function destino(x, y, l, k) {
		var el = document.elementFromPoint(x, y);
		if (!el) { return null; }
		var t = tacho();
		if (t && (el === t || t.contains(el))) { return { tacho: true }; }
		if (!util.hayMetodo()) { return null; }
		if (k) { return destinoDecl(x, y, k, l); }
		var zonaDiagrama = util.zonaDiagrama();
		if (!zonaDiagrama || !zonaDiagrama.contains(el)) { return null; }
		if (el.closest(".local-variable-declaration,.method-parameters")) { return null; }

		var hh = subir(el, esHueco, zonaDiagrama.parentNode);
		if (hh && !adentroDe(hh, l)) { return { hueco: hh }; }

		var b = util.bloqueDe(el);
		while (b && adentroDe(b, l)) { b = util.bloqueDe(b.parentNode); }
		if (b) {
			var r = b.getBoundingClientRect();
			var hermano = (y < r.top + r.height / 2) ? b.previousElementSibling : b.nextElementSibling;
			if (esHueco(hermano) && !adentroDe(hermano, l)) { return { hueco: hermano }; }
		}

		var casa = subir(el, function (n) {
			return n.classList && (n.classList.contains("statements") ||
				n.classList.contains("then") || n.classList.contains("else"));
		}, zonaDiagrama.parentNode);
		if (casa) {
			var libres = Array.prototype.filter.call(casa.children, esHueco);
			for (var i = libres.length - 1; i >= 0; i--) {
				if (!adentroDe(libres[i], l)) { return { hueco: libres[i] }; }
			}
		}
		return null;
	}

	function hacerFantasma(orig, extra, sinMarco) {
		var f = document.createElement("div");
		f.id = "nshDragGhost";
		var copia = orig.cloneNode(true);
		util.qq(".nsh-ui", copia).forEach(function (n) { n.parentNode.removeChild(n); });
		copia.classList.remove("nsh-selected", "nsh-find-marked");
		if (sinMarco) {
			f.classList.add("nsh-ghost-plain");
			f.appendChild(copia);
		} else {
			var marco = document.createElement("div");
			marco.className = "Nassi-Shneiderman";
			marco.style.padding = "0";
			marco.appendChild(copia);
			f.appendChild(marco);
		}
		if (extra > 0) {
			var n = document.createElement("span");
			n.className = "nsh-ghost-count";
			n.textContent = "+" + extra;
			f.appendChild(n);
		}
		f.style.width = Math.min(orig.getBoundingClientRect().width, 420) + "px";
		document.body.appendChild(f);
		return f;
	}

	function moverFantasma(x, y) {
		if (fantasma) {
			fantasma.style.left = (x + 12) + "px";
			fantasma.style.top = (y + 12) + "px";
		}
	}

	function laRaya() {
		if (!raya) {
			raya = document.createElement("div");
			raya.id = "nshDropLine";
			document.body.appendChild(raya);
		}
		return raya;
	}

	function mostrarRaya(hh) {
		if (!hh) { esconderRaya(); return; }
		var l = laRaya();
		l.classList.remove("nsh-drop-line-vertical");
		var r = hh.getBoundingClientRect();
		var ancho = r.width;
		if (ancho < 6 && hh.parentNode) {
			r = hh.parentNode.getBoundingClientRect();
			ancho = r.width;
		}
		l.style.left = r.left + "px";
		l.style.top = (r.top + r.height / 2 - 1.5) + "px";
		l.style.width = ancho + "px";
		l.style.height = "";
	}

	function rayaDecl(d) {
		if (!d || !d.casa) { esconderRaya(); return; }
		var ref = d.antes || d.casa.lastElementChild;
		var r = (ref || d.casa).getBoundingClientRect();
		var alFinal = !d.antes;
		var l = laRaya();
		l.classList.add("nsh-drop-line-vertical");
		l.style.left = ((alFinal ? r.right : r.left) - 1.5) + "px";
		l.style.top = r.top + "px";
		l.style.width = "";
		l.style.height = Math.max(r.height, 14) + "px";
	}

	function esconderRaya() {
		if (raya && raya.parentNode) { raya.parentNode.removeChild(raya); }
		raya = null;
	}

	function desdePlantilla(json) {
		var p = armarBloque(JSON.parse(json));
		if (p.getAttribute("type") === "switch") { lienzo.makeButtonAddInSwitch(p); }
		return p;
	}

	function insertarPlantilla(json, hh) {
		if (!util.hayMetodo()) {
			util.aviso("Abrí un método antes de agregar bloques");
			return false;
		}
		var destino = hh || seleccion.huecoCerca();
		if (!destino) { return false; }
		var p = desdePlantilla(json);
		seleccion.meterEn(destino, p);
		seleccion.refrescarLienzo();
		seleccion.soloEste(p);
		p.scrollIntoView({ block: "nearest", behavior: "smooth" });
		var i = p.querySelector(".input-for-statement");
		if (i) { i.focus(); i.select(); }
		return true;
	}

	function candidato(e) {
		if (e.button !== 0 && e.pointerType === "mouse") { return null; }
		var t = e.target;
		if (!t.closest) { return null; }

		if (t.closest("#menuContainer, #nshFindResults")) {
			var casa = t.closest(".nsh-palette-item");
			if (!casa) { return null; }
			var muestra = casa.querySelector("[draggable=\"true\"]");
			if (!muestra || !muestra.template) { return null; }
			var delBuscador = !!t.closest("#nshFindResults");
			return {
				modo: "copia",
				plantilla: muestra.template,
				origen: delBuscador ? casa : muestra,
				sinMarco: delBuscador
			};
		}

		if (util.escribiendo(t)) { return null; }
		if (t.classList && (t.classList.contains("nsh-check") || t.closest(".switch-button"))) { return null; }

		var zonaDiagrama = util.zonaDiagrama();
		if (zonaDiagrama && zonaDiagrama.contains(t)) {
			var b = util.bloqueDe(t);
			if (b) {
				return { modo: "mover", caja: b, origen: b, decl: util.tipoDeclaracion(b) };
			}
		}
		return null;
	}

	function queLlevo(b) {
		if (util.esDeclaracion(b)) { return [b]; }
		if (seleccion.tiene(b) && seleccion.cuantos() > 1) {
			return seleccion.padres().filter(function (x) { return !util.esDeclaracion(x); });
		}
		return [b];
	}

	function arrancar() {
		viaje.activo = true;
		document.body.classList.add("nsh-dragging");
		var t = tacho();
		if (t) { t.classList.remove("invisible"); }
		if (viaje.sinMarco && typeof buscador !== "undefined") { buscador.cerrar(); }
		fantasma = hacerFantasma(viaje.origen, viaje.llevados.length - 1, viaje.sinMarco);
		moverFantasma(viaje.x, viaje.y);
	}

	function limpiarVisual() {
		document.body.classList.remove("nsh-dragging");
		esconderRaya();
		if (fantasma && fantasma.parentNode) { fantasma.parentNode.removeChild(fantasma); }
		fantasma = null;
		var t = tacho();
		if (t) {
			t.classList.add("invisible");
			t.classList.remove("trash-over");
		}
	}

	function soltar(v, d) {
		if (!d) { return false; }
		if (d.tacho) {
			if (v.modo === "copia") { return false; }
			v.llevados.forEach(seleccion.quitarBloque);
			seleccion.limpiarSeleccion();
			seleccion.refrescarLienzo();
			seleccion.comas();
			util.aviso(v.llevados.length === 1 ? "Se eliminó el bloque" : "Se eliminaron " + v.llevados.length + " bloques");
			return true;
		}

		if (d.casa) {
			var decl = v.llevados[0];
			if (!decl || d.antes === decl) { return false; }
			d.casa.insertBefore(decl, d.antes);
			seleccion.comas();
			seleccion.refrescarLienzo();
			seleccion.soloEste(decl);
			return true;
		}

		if (!d.hueco) { return false; }

		if (v.modo === "copia") {
			var p = desdePlantilla(v.plantilla);
			seleccion.meterEn(d.hueco, p);
			seleccion.refrescarLienzo();
			seleccion.soloEste(p);
			return true;
		}

		var movidos = [];
		v.llevados.forEach(function (b) {
			var sig = b.nextSibling;
			if (esHueco(sig)) { sig.parentNode.removeChild(sig); }
			if (b.parentNode) { b.parentNode.removeChild(b); }
			if (seleccion.meterEn(d.hueco, b)) { movidos.push(b); }
		});
		if (!movidos.length) { return false; }
		seleccion.refrescarLienzo();
		seleccion.poner(movidos);
		return true;
	}

	function alMover(e) {
		if (!viaje) { return; }
		viaje.x = e.clientX;
		viaje.y = e.clientY;
		if (!viaje.activo) {
			if (Math.abs(e.clientX - viaje.x0) + Math.abs(e.clientY - viaje.y0) < MINIMO) { return; }
			arrancar();
		}
		e.preventDefault();
		moverFantasma(e.clientX, e.clientY);
		var d = destino(e.clientX, e.clientY, viaje.llevados, viaje.decl);
		viaje.destino = d;
		var t = tacho();
		if (t) { t.classList.toggle("trash-over", !!(d && d.tacho)); }
		if (d && d.casa) { rayaDecl(d); } else { mostrarRaya(d && d.hueco ? d.hueco : null); }
		empujar(e.clientY);
	}

	function empujar(y) {
		var marco = document.getElementById("nshCanvas");
		if (!marco) { return; }
		var r = marco.getBoundingClientRect();
		if (y < r.top + 48) { marco.scrollTop -= 12; }
		else if (y > r.bottom - 48) { marco.scrollTop += 12; }
	}

	function marcar() {
		recien = true;
		var libera = function () {
			recien = false;
			window.removeEventListener("click", libera);
		};
		window.addEventListener("click", libera);
		window.setTimeout(libera, 300);
	}

	function alSoltar() {
		var v = viaje;
		viaje = null;
		desenchufar();
		if (!v) { return; }
		if (!v.activo) {
			if (v.modo === "copia") {
				insertarPlantilla(v.plantilla, null);
				marcar();
			}
			return;
		}
		limpiarVisual();
		var hubo = soltar(v, v.destino);
		if (!hubo && v.modo === "mover") {
			util.aviso(v.decl
				? "Las variables y los parámetros van siempre arriba, en el encabezado"
				: "Soltá el bloque dentro del diagrama");
		}
		marcar();
	}

	function alEscape(e) {
		if (e.key === "Escape" && viaje) {
			var estaba = viaje.activo;
			desenchufar();
			if (estaba) { limpiarVisual(); }
			viaje = null;
			e.preventDefault();
		}
	}

	function desenchufar() {
		window.removeEventListener("pointermove", alMover, true);
		window.removeEventListener("pointerup", alSoltar, true);
		window.removeEventListener("pointercancel", alSoltar, true);
		window.removeEventListener("keydown", alEscape, true);
	}

	function alApretar(e) {
		if (viaje) { return; }
		var c = candidato(e);
		if (!c) { return; }
		if ((e.ctrlKey || e.metaKey || e.shiftKey) && c.modo === "mover") { return; }
		viaje = {
			modo: c.modo,
			plantilla: c.plantilla,
			origen: c.origen,
			sinMarco: c.sinMarco || false,
			decl: c.decl || null,
			llevados: c.modo === "mover" ? queLlevo(c.caja) : [],
			x0: e.clientX,
			y0: e.clientY,
			x: e.clientX,
			y: e.clientY,
			activo: false,
			destino: null
		};
		window.addEventListener("pointermove", alMover, true);
		window.addEventListener("pointerup", alSoltar, true);
		window.addEventListener("pointercancel", alSoltar, true);
		window.addEventListener("keydown", alEscape, true);
	}

	o.iniciar = function () {
		document.addEventListener("pointerdown", alApretar);
		document.addEventListener("dragstart", function (e) {
			var zonaDiagrama = util.zonaDiagrama();
			var pal = document.getElementById("menuContainer");
			if ((zonaDiagrama && zonaDiagrama.contains(e.target)) || (pal && pal.contains(e.target))) { e.preventDefault(); }
		});
	};
	o.insertarPlantilla = insertarPlantilla;
	o.huboArrastre = function () { return recien; };

	return o;
}());
