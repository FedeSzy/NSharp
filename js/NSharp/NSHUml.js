var uml = (function () {
	var o = {};

	var ANCHO = 3200;
	var ALTO = 2200;
	var GRILLA = 10;
	var TXT_CLASE = "LaClase\n--\n-elAtributo: int\n--\n+elMetodo(): void";
	var TXT_NOTA = "Escribí acá tu aclaración";
	var TXT_LINEA = "Cardinalidad\n--> 0..n\n<--0..n";
	var INSET_ROTULO = 20;

	var VINCULOS = [
		{ id: "aso", nombre: "Asociación" },
		{ id: "dir", nombre: "Asociación dirigida" },
		{ id: "her", nombre: "Herencia (extends)" },
		{ id: "imp", nombre: "Implementación (implements)" },
		{ id: "agr", nombre: "Agregación" },
		{ id: "com", nombre: "Composición" },
		{ id: "dep", nombre: "Dependencia" }
	];

	var SIGNOS = { "+": "public", "-": "private", "#": "protected", "~": "package" };

	var elementos = [];
	var relaciones = [];
	var memoria = [];
	var elegido = null;
	var tipoNuevo = "aso";
	var uniendo = false;
	var desde = null;
	var nivelZoom = 1;
	var vista = false;
	var arrastreActual = null;
	var pan = null;
	var espacio = false;
	var dedos = {};
	var pellizco = null;
	var ultimoToque = { id: null, t: 0 };

	function lienzoUml() { return document.getElementById("umlCanvas"); }

	function plano() { return document.getElementById("umlScroll"); }

	function svg() { return document.getElementById("umlSvg"); }

	function panel() { return document.getElementById("umlText"); }

	function porId(id) {
		for (var i = 0; i < elementos.length; i++) { if (elementos[i].id === id) { return elementos[i]; } }
		return null;
	}

	function nombreVinculo(t) {
		for (var i = 0; i < VINCULOS.length; i++) {
			if (VINCULOS[i].id === t) { return VINCULOS[i].nombre; }
		}
		return "Relación";
	}

	function lineaPorId(id) {
		for (var i = 0; i < relaciones.length; i++) { if (relaciones[i].id === id) { return relaciones[i]; } }
		return null;
	}

	function tramos(txt) {
		var g = [[]];
		(txt || "").split(/\r?\n/).forEach(function (l) {
			if (/^\s*-{2,}\s*$/.test(l)) { g.push([]); } else { g[g.length - 1].push(l); }
		});
		return g;
	}

	function adorno(l) {
		var s = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		s = s.replace(/&lt;&lt;(.+?)&gt;&gt;/g, '<i class="uml-estereo">&laquo;$1&raquo;</i>');
		s = s.replace(/(^|\s)_(\S.*?\S|\S)_(?=\s|$)/g, "$1<u>$2</u>");
		s = s.replace(/(^|\s)\/(\S.*?\S|\S)\/(?=\s|$)/g, "$1<em>$2</em>");
		return s || "&nbsp;";
	}

	function esMetodo(l) { return l.indexOf("(") !== -1; }

	function limpioNombre(l) {
		return l.replace(/^\s*[+\-#~]\s*/, "").replace(/[_\/]/g, "").trim();
	}

	function nombreDe(c) {
		var cab = tramos(c.txt)[0] || [];
		for (var i = 0; i < cab.length; i++) {
			var l = cab[i].trim();
			if (!l || /^<<.*>>$/.test(l)) { continue; }
			return limpioNombre(l);
		}
		return "";
	}

	function params(s) {
		if (!s || !s.trim()) { return []; }
		return s.split(",").map(function (p) {
			p = p.trim();
			if (!p) { return null; }
			var d = p.split(":");
			if (d.length > 1) { return { nombre: d[0].trim() || "x", tipo: d.slice(1).join(":").trim() || "tipo" }; }
			var w = p.split(/\s+/);
			if (w.length > 1) { return { tipo: w[0], nombre: w.slice(1).join(" ") }; }
			return { tipo: "tipo", nombre: p };
		}).filter(Boolean);
	}

	function firma(l) {
		var s = l.trim();
		if (!s) { return null; }
		var vis = "public";
		var m = s.match(/^([+\-#~])\s*/);
		if (m) { vis = SIGNOS[m[1]]; s = s.slice(m[0].length); }
		var estatico = false;
		if (/^_.*_$/.test(s)) { estatico = true; s = s.slice(1, -1); }
		var a = s.indexOf("(");
		var b = s.lastIndexOf(")");
		if (a === -1 || b === -1 || b < a) { return null; }
		var nombre = s.slice(0, a).trim().replace(/[_\/]/g, "");
		if (!nombre) { return null; }
		var resto = s.slice(b + 1).trim();
		var tipo = "void";
		var t = resto.match(/^:?\s*(.+)$/);
		if (t) { tipo = t[1].trim(); }
		return {
			nombre: nombre,
			vis: estatico ? vis + " static" : vis,
			tipo: tipo,
			params: params(s.slice(a + 1, b))
		};
	}

	function leer(c) {
		var g = tramos(c.txt);
		var mets = [];
		for (var i = 1; i < g.length; i++) {
			g[i].forEach(function (l) {
				if (!esMetodo(l)) { return; }
				var f = firma(l);
				if (f) { mets.push(f); }
			});
		}
		return { nombre: nombreDe(c), mets: mets };
	}

	function nueva(k, x, y) {
		var c = {
			id: util.nuevoId("u"),
			k: k,
			x: Math.max(0, Math.round(x / GRILLA) * GRILLA),
			y: Math.max(0, Math.round(y / GRILLA) * GRILLA),
			w: k === "nota" ? 150 : 210,
			h: k === "nota" ? 70 : 120,
			txt: k === "nota" ? TXT_NOTA : TXT_CLASE
		};
		elementos.push(c);
		elegido = c.id;
		util.marcarCambios();
		pintar();
		var t = panel();
		if (t) { t.focus(); t.select(); }
		return c;
	}

	function centroVista() {
		var m = plano();
		if (!m) { return { x: 120, y: 120 }; }
		return { x: (m.scrollLeft + m.clientWidth / 2) / nivelZoom, y: (m.scrollTop + m.clientHeight / 2) / nivelZoom };
	}

	function duplicar() {
		var c = elegido ? porId(elegido) : null;
		if (!c) { return false; }
		var copia = { id: util.nuevoId("u"), k: c.k, x: c.x + 20, y: c.y + 20, w: c.w, h: c.h, txt: c.txt };
		elementos.push(copia);
		elegido = copia.id;
		util.marcarCambios();
		pintar();
		verElegido();
		return true;
	}

	function correrElegido(dx, dy) {
		var c = elegido ? porId(elegido) : null;
		if (!c) { return false; }
		c.x = Math.max(0, c.x + dx);
		c.y = Math.max(0, c.y + dy);
		util.marcarCambios();
		pintar();
		verElegido();
		return true;
	}

	function rotarElegido(paso) {
		if (!elementos.length) { return; }
		var i = -1;
		elementos.forEach(function (c, n) { if (c.id === elegido) { i = n; } });
		var j = ((i + paso) % elementos.length + elementos.length) % elementos.length;
		elegir(elementos[j].id);
		verElegido();
	}

	function verElegido() {
		var m = plano();
		var c = elegido ? porId(elegido) : null;
		if (!m || !c) { return; }
		var x1 = c.x * nivelZoom, y1 = c.y * nivelZoom, x2 = (c.x + c.w) * nivelZoom, y2 = (c.y + c.h) * nivelZoom;
		if (x1 < m.scrollLeft + 20) { m.scrollLeft = Math.max(0, x1 - 40); }
		else if (x2 > m.scrollLeft + m.clientWidth - 20) { m.scrollLeft = x2 - m.clientWidth + 40; }
		if (y1 < m.scrollTop + 20) { m.scrollTop = Math.max(0, y1 - 40); }
		else if (y2 > m.scrollTop + m.clientHeight - 20) { m.scrollTop = y2 - m.clientHeight + 40; }
	}

	function editarElegido() {
		var t = panel();
		if (t && !t.disabled) { t.focus(); t.select(); }
	}

	function borrarElegido() {
		if (!elegido) { return; }
		var l = lineaPorId(elegido);
		if (l) {
			relaciones = relaciones.filter(function (x) { return x.id !== elegido; });
		} else {
			elementos = elementos.filter(function (x) { return x.id !== elegido; });
			relaciones = relaciones.filter(function (x) { return x.de !== elegido && x.a !== elegido; });
		}
		elegido = null;
		util.marcarCambios();
		pintar();
	}

	function marco(c) { return { cx: c.x + c.w / 2, cy: c.y + c.h / 2, w: c.w, h: c.h }; }

	function borde(r, hx, hy) {
		var dx = hx - r.cx, dy = hy - r.cy;
		if (!dx && !dy) { return { x: r.cx, y: r.cy }; }
		var sx = dx ? (r.w / 2) / Math.abs(dx) : Infinity;
		var sy = dy ? (r.h / 2) / Math.abs(dy) : Infinity;
		var s = Math.min(sx, sy);
		return { x: r.cx + dx * s, y: r.cy + dy * s };
	}

	function triangulo(p, ang, t) {
		var a = ang + Math.PI - 0.42, b = ang + Math.PI + 0.42;
		return "M" + p.x + "," + p.y +
			" L" + (p.x + Math.cos(a) * t) + "," + (p.y + Math.sin(a) * t) +
			" L" + (p.x + Math.cos(b) * t) + "," + (p.y + Math.sin(b) * t) + " Z";
	}

	function rombo(p, ang, t) {
		var ux = Math.cos(ang), uy = Math.sin(ang);
		var px = -uy, py = ux;
		var fondo = { x: p.x - ux * t, y: p.y - uy * t };
		var mx = p.x - ux * t / 2, my = p.y - uy * t / 2;
		return "M" + p.x + "," + p.y +
			" L" + (mx + px * t * 0.4) + "," + (my + py * t * 0.4) +
			" L" + fondo.x + "," + fondo.y +
			" L" + (mx - px * t * 0.4) + "," + (my - py * t * 0.4) + " Z";
	}

	function flecha(p, ang, t) {
		var a = ang + Math.PI - 0.48, b = ang + Math.PI + 0.48;
		return "M" + (p.x + Math.cos(a) * t) + "," + (p.y + Math.sin(a) * t) +
			" L" + p.x + "," + p.y +
			" L" + (p.x + Math.cos(b) * t) + "," + (p.y + Math.sin(b) * t);
	}

	function nodo(tag, attrs) {
		var n = document.createElementNS("http://www.w3.org/2000/svg", tag);
		Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
		return n;
	}

	function iconoVinculo(t) {
		var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		s.setAttribute("viewBox", "0 0 54 18");
		s.setAttribute("class", "uml-tipo-svg");
		var a = { x: 5, y: 9 }, b = { x: 49, y: 9 };
		var d1 = a, d2 = b;
		var extra = [];

		if (t === "her" || t === "imp") {
			extra.push(nodo("path", { d: triangulo(b, 0, 9), "class": "uml-ico-hueco" }));
			d2 = { x: b.x - 8.4, y: b.y };
		} else if (t === "dir" || t === "dep") {
			extra.push(nodo("path", { d: flecha(b, 0, 7), "class": "uml-ico-linea" }));
		}
		if (t === "agr" || t === "com") {
			extra.push(nodo("path", {
				d: rombo(a, Math.PI, 11),
				"class": t === "com" ? "uml-ico-lleno" : "uml-ico-hueco"
			}));
			d1 = { x: a.x + 11, y: a.y };
		}

		var linea = nodo("path", {
			d: "M" + d1.x + "," + d1.y + " L" + d2.x + "," + d2.y,
			"class": "uml-ico-linea"
		});
		if (t === "dep" || t === "imp") { linea.setAttribute("stroke-dasharray", "5 3"); }
		s.appendChild(linea);
		extra.forEach(function (n) { s.appendChild(n); });
		return s;
	}

	function elegirTipo(t) {
		tipoNuevo = t;
		var l = elegido ? lineaPorId(elegido) : null;
		if (l && l.t !== t) { l.t = t; util.marcarCambios(); }
		pintar();
	}

	function tocarUnion() {
		uniendo = !uniendo;
		desde = null;
		pintar();
		if (uniendo) { util.aviso("Elegí primero la clase de origen y después la de destino"); }
	}

	function pintarTipos() {
		var l = elegido ? lineaPorId(elegido) : null;
		var actual = l ? l.t : tipoNuevo;
		util.qq("#umlRelTipos .uml-tipo").forEach(function (b) {
			b.classList.toggle("uml-tipo-on", b.getAttribute("data-uml-t") === actual);
		});
	}

	function dibujarLineas() {
		var s = svg();
		if (!s) { return; }
		s.innerHTML = "";
		s.setAttribute("width", ANCHO);
		s.setAttribute("height", ALTO);
		s.setAttribute("viewBox", "0 0 " + ANCHO + " " + ALTO);

		relaciones.forEach(function (l) {
			var a = porId(l.de), b = porId(l.a);
			if (!a || !b) { return; }
			var ra = marco(a), rb = marco(b);
			var p1 = borde(ra, rb.cx, rb.cy);
			var p2 = borde(rb, ra.cx, ra.cy);
			var ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
			var d1 = p1, d2 = p2;
			var puntos = "";
			var vacio = "var(--nsh-surface)";
			var tinta = "var(--nsh-line)";
			var extra = [];

			if (l.t === "her" || l.t === "imp") {
				extra.push(nodo("path", { d: triangulo(p2, ang, 14), fill: vacio, stroke: tinta, "stroke-width": 1.6 }));
				d2 = { x: p2.x - Math.cos(ang) * 13, y: p2.y - Math.sin(ang) * 13 };
			} else if (l.t === "dir" || l.t === "dep") {
				extra.push(nodo("path", { d: flecha(p2, ang, 11), fill: "none", stroke: tinta, "stroke-width": 1.6 }));
			}
			if (l.t === "agr" || l.t === "com") {
				var back = ang + Math.PI;
				extra.push(nodo("path", {
					d: rombo(p1, back, 16),
					fill: l.t === "com" ? tinta : vacio,
					stroke: tinta, "stroke-width": 1.6
				}));
				d1 = { x: p1.x + Math.cos(ang) * 16, y: p1.y + Math.sin(ang) * 16 };
			}

			puntos = "M" + d1.x + "," + d1.y + " L" + d2.x + "," + d2.y;
			var trazo = nodo("path", {
				d: puntos, fill: "none", stroke: tinta, "stroke-width": 1.6,
				"stroke-dasharray": (l.t === "dep" || l.t === "imp") ? "7 5" : "none"
			});
			if (elegido === l.id) { trazo.setAttribute("stroke", "var(--nsh-accent)"); }
			s.appendChild(trazo);
			extra.forEach(function (n) {
				if (elegido === l.id) { n.setAttribute("stroke", "var(--nsh-accent)"); }
				s.appendChild(n);
			});

			var golpe = nodo("path", {
				d: puntos, fill: "none", stroke: "transparent", "stroke-width": 14,
				"class": "uml-golpe", "data-uml-rel": l.id
			});
			s.appendChild(golpe);

			if (l.txt) {
				var renglones = l.txt.split(/\r?\n/);
				var arriba = renglones[0] || "";
				var centro = [], izq = "", der = "";
				renglones.slice(1).forEach(function (r) {
					var s2 = r.trim();
					if (!s2) { return; }
					if (/^-->/.test(s2)) { der = s2.replace(/^-->\s*/, ""); }
					else if (/^<--/.test(s2)) { izq = s2.replace(/^<--\s*/, ""); }
					else { centro.push(s2); }
				});

				var mx = (d1.x + d2.x) / 2, my = (d1.y + d2.y) / 2;

				if (arriba) {
					var tA = nodo("text", { x: mx, y: my - 6, "text-anchor": "middle", "class": "uml-rotulo" });
					tA.textContent = arriba;
					s.appendChild(tA);
				}
				if (centro.length) {
					var tC = nodo("text", { x: mx, y: my + 14, "text-anchor": "middle", "class": "uml-rotulo" });
					tC.textContent = centro.join(" ");
					s.appendChild(tC);
				}
				if (izq) {
					var haciaDer = d2.x >= d1.x;
					var xIzq = d1.x + (haciaDer ? INSET_ROTULO : -INSET_ROTULO);
					var ancIzq = haciaDer ? "start" : "end";
					var tI = nodo("text", { x: xIzq, y: d1.y + 14, "text-anchor": ancIzq, "class": "uml-rotulo" });
					tI.textContent = izq;
					s.appendChild(tI);
				}
				if (der) {
					var haciaIzq = d2.x >= d1.x;
					var xDer = d2.x - (haciaIzq ? INSET_ROTULO : -INSET_ROTULO);
					var ancDer = haciaIzq ? "end" : "start";
					var tD = nodo("text", { x: xDer, y: d2.y + 14, "text-anchor": ancDer, "class": "uml-rotulo" });
					tD.textContent = der;
					s.appendChild(tD);
				}
			}
		});
	}

	function cuerpo(c) {
		if (c.k === "nota") {
			return '<div class="uml-tramo uml-libre">' +
				(c.txt || "").split(/\r?\n/).map(adorno).join("<br>") + "</div>";
		}
		var g = tramos(c.txt);
		return g.map(function (lineas2, i) {
			var html = lineas2.map(adorno).join("<br>");
			return '<div class="uml-tramo' + (i === 0 ? " uml-tit" : "") + '">' + html + "</div>";
		}).join("");
	}

	function pintar() {
		var casa = lienzoUml();
		if (!casa) { return; }
		util.qq(".uml-caja", casa).forEach(function (n) { n.remove(); });

		elementos.forEach(function (c) {
			var d = document.createElement("div");
			d.className = "uml-caja" + (c.k === "nota" ? " uml-nota" : "") +
				(elegido === c.id ? " uml-elegida" : "") +
				(desde === c.id ? " uml-origen" : "");
			d.setAttribute("data-uml-id", c.id);
			d.style.left = c.x + "px";
			d.style.top = c.y + "px";
			d.style.width = c.w + "px";
			d.style.height = c.h + "px";
			d.innerHTML = cuerpo(c) + '<span class="uml-tirador"></span>';
			casa.appendChild(d);
			if (d.scrollHeight > c.h) {
				c.h = Math.ceil(d.scrollHeight / GRILLA) * GRILLA;
				d.style.height = c.h + "px";
			}
		});

		dibujarLineas();
		pintarPanel();
		pintarTipos();
		var lv = document.getElementById("umlZoomLevel");
		if (lv) { lv.textContent = Math.round(nivelZoom * 100) + "%"; }
		var bu = document.getElementById("umlUnir");
		if (bu) { bu.classList.toggle("uml-on", uniendo); }
	}

	function pintarPanel() {
		var t = panel();
		var cartel = document.getElementById("umlQue");
		if (!t) { return; }
		var c = elegido ? porId(elegido) : null;
		var l = elegido ? lineaPorId(elegido) : null;
		t.disabled = !c && !l;
		if (c) {
			if (t.value !== c.txt) { t.value = c.txt; }
			if (cartel) { cartel.textContent = c.k === "nota" ? "Nota seleccionada" : "Clase seleccionada"; }
		} else if (l) {
			if (t.value !== (l.txt || "")) { t.value = l.txt || ""; }
			if (cartel) { cartel.textContent = nombreVinculo(l.t); }
		} else {
			t.value = "";
			if (cartel) { cartel.textContent = "No hay nada seleccionado"; }
		}
	}

	function elegir(id) {
		elegido = id;
		pintar();
	}

	function puntoEnTela(e) {
		var casa = lienzoUml();
		var r = casa.getBoundingClientRect();
		return { x: (e.clientX - r.left) / nivelZoom, y: (e.clientY - r.top) / nivelZoom };
	}

	function alApretar(e) {
		var casa = lienzoUml();
		if (!casa) { return; }
		var rel = e.target.getAttribute && e.target.getAttribute("data-uml-rel");
		if (rel) { elegir(rel); return; }

		var caja = e.target.closest ? e.target.closest(".uml-caja") : null;
		if (!caja) {
			if (e.target === casa || e.target === svg()) {
				desde = null;
				uniendo = false;
				elegir(null);
			}
			return;
		}
		var c = porId(caja.getAttribute("data-uml-id"));
		if (!c) { return; }

		if (uniendo) {
			if (!desde) { desde = c.id; pintar(); return; }
			if (desde !== c.id) {
				relaciones.push({ id: util.nuevoId("r"), de: desde, a: c.id, t: tipoNuevo, txt: TXT_LINEA });
				util.marcarCambios();
			}
			desde = null;
			uniendo = false;
			pintar();
			return;
		}

		var ahora = Date.now();
		var doble = ultimoToque.id === c.id && (ahora - ultimoToque.t) < 400;
		ultimoToque = { id: c.id, t: ahora };
		if (doble) {
			e.preventDefault();
			ultimoToque = { id: null, t: 0 };
			elegido = c.id;
			if (duplicar()) {
				util.aviso(c.k === "nota" ? "Se duplicó la nota" : "Se duplicó la clase");
			}
			return;
		}

		elegir(c.id);
		var p = puntoEnTela(e);
		arrastreActual = {
			c: c,
			modo: e.target.classList.contains("uml-tirador") ? "redimensionar" : "mover",
			x0: p.x, y0: p.y,
			ax: c.x, ay: c.y, aw: c.w, ah: c.h
		};
		e.preventDefault();
		window.addEventListener("pointermove", alMover, true);
		window.addEventListener("pointerup", alSoltar, true);
		window.addEventListener("pointercancel", alSoltar, true);
	}

	function alMover(e) {
		if (!arrastreActual) { return; }
		var p = puntoEnTela(e);
		var dx = p.x - arrastreActual.x0, dy = p.y - arrastreActual.y0;
		var c = arrastreActual.c;
		if (Math.abs(dx) > 2 || Math.abs(dy) > 2) { ultimoToque = { id: null, t: 0 }; }
		if (arrastreActual.modo === "redimensionar") {
			c.w = Math.max(90, Math.round((arrastreActual.aw + dx) / GRILLA) * GRILLA);
			c.h = Math.max(50, Math.round((arrastreActual.ah + dy) / GRILLA) * GRILLA);
		} else {
			c.x = Math.max(0, Math.round((arrastreActual.ax + dx) / GRILLA) * GRILLA);
			c.y = Math.max(0, Math.round((arrastreActual.ay + dy) / GRILLA) * GRILLA);
		}
		var d = lienzoUml().querySelector('.uml-caja[data-uml-id="' + c.id + '"]');
		if (d) {
			d.style.left = c.x + "px";
			d.style.top = c.y + "px";
			d.style.width = c.w + "px";
			d.style.height = c.h + "px";
		}
		dibujarLineas();
		e.preventDefault();
	}

	function alSoltar() {
		window.removeEventListener("pointermove", alMover, true);
		window.removeEventListener("pointerup", alSoltar, true);
		window.removeEventListener("pointercancel", alSoltar, true);
		if (arrastreActual) { util.marcarCambios(); }
		arrastreActual = null;
		pintar();
	}

	function metPorNombre(carpeta, nombre) {
		var r = null;
		metodos.lista().forEach(function (d) {
			if (!r && clases.claseDeMetodo(d.id) === carpeta && (d.name || "") === nombre) { r = d; }
		});
		return r;
	}

	function recuerdo(id) {
		for (var i = 0; i < memoria.length; i++) { if (memoria[i].uml === id) { return memoria[i]; } }
		return null;
	}

	function armarPlan() {
		var info = [];
		var vistos = {};
		var ac = { nuevasClases: [], renClases: [], borraClases: [], nuevos: [], renombra: [], borra: [] };

		elementos.forEach(function (c) {
			if (c.k !== "clase") { return; }
			var t = leer(c);
			if (!t.nombre) { return; }
			var r = recuerdo(c.id);
			var carpeta = (r && clases.porId(r.carpeta)) ? r.carpeta : null;
			if (!carpeta) {
				clases.todas().forEach(function (f) {
					if (!carpeta && (f.name || "").trim() === t.nombre) { carpeta = f.id; }
				});
			}
			var x = { el: c, nombre: t.nombre, mets: t.mets, carpeta: carpeta, pares: [] };
			if (!carpeta) { ac.nuevasClases.push(x); }
			else if ((clases.porId(carpeta).name || "").trim() !== t.nombre) { ac.renClases.push(x); }
			vistos[c.id] = true;

			var viejos = [];
			if (r && carpeta) {
				r.mets.forEach(function (n) {
					var d = metPorNombre(carpeta, n);
					if (d) { viejos.push({ n: n, d: d }); }
				});
			}
			var quedanN = x.mets.slice();
			var quedanV = viejos.slice();

			quedanN.slice().forEach(function (n) {
				for (var i = 0; i < quedanV.length; i++) {
					if (quedanV[i].n === n.nombre) {
						x.pares.push({ nuevo: n, d: quedanV[i].d });
						ac.renombra.push({ d: quedanV[i].d, nuevo: n, clase: x });
						quedanV.splice(i, 1);
						quedanN.splice(quedanN.indexOf(n), 1);
						return;
					}
				}
			});
			while (quedanN.length && quedanV.length) {
				var n2 = quedanN.shift(), v = quedanV.shift();
				x.pares.push({ nuevo: n2, d: v.d });
				ac.renombra.push({ d: v.d, nuevo: n2, clase: x });
			}
			quedanN.forEach(function (n) { ac.nuevos.push({ nuevo: n, clase: x }); });
			quedanV.forEach(function (v) { ac.borra.push(v.d); });

			info.push(x);
		});

		memoria.forEach(function (r) {
			if (vistos[r.uml]) { return; }
			ac.borraClases.push(r);
			if (!clases.porId(r.carpeta)) { return; }
			r.mets.forEach(function (n) {
				var d = metPorNombre(r.carpeta, n);
				if (d && ac.borra.indexOf(d) === -1) { ac.borra.push(d); }
			});
		});

		return { info: info, ac: ac };
	}

	function sincronizar() {
		if (typeof proy === "undefined" || !proy) { return; }
		actualizarDiagrama();
		var p = armarPlan();
		var ac = p.ac;

		if (!p.info.length && !ac.borraClases.length) {
			util.aviso("Agregá al menos una clase al diagrama UML");
			return;
		}

		if (ac.borra.length) {
			var conBloques = ac.borra.filter(function (d) { return metodos.cuantosBloques(d) > 0; });
			var detalle = ac.borra.map(function (d) {
				var n = metodos.cuantosBloques(d);
				return "  · " + (d.theClass ? d.theClass + "." : "") + (d.name || "sin nombre") + "()" +
					(n === 1 ? "   (1 bloque)" : n ? "   (" + n + " bloques)" : "   (vacío)");
			}).join("\n");
			var texto = (ac.borra.length === 1
				? "Este método ya no está en el diagrama UML y se va a eliminar del proyecto:"
				: "Estos " + ac.borra.length + " métodos ya no están en el diagrama UML y se van a eliminar del proyecto:") +
				"\n\n" + detalle;
			if (conBloques.length) {
				texto += "\n\nAtención: " + (ac.borra.length === 1
					? "ese método ya tiene bloques hechos y se van a perder."
					: conBloques.length === 1
						? "uno de ellos ya tiene bloques hechos y se van a perder."
						: conBloques.length + " de ellos ya tienen bloques hechos y se van a perder.");
			}
			texto += "\n\n¿Querés continuar?";
			if (!confirm(texto)) { return; }
		}

		var nuevos = [];
		ac.borra.forEach(eliminarMetodo);
		ac.borraClases.forEach(function (r) { if (clases.porId(r.carpeta)) { clases.eliminar(r.carpeta); } });

		p.info.forEach(function (x) {
			if (!x.carpeta) {
				x.carpeta = clases.nueva(x.nombre, null).id;
			} else {
				clases.renombrar(x.carpeta, x.nombre);
				clases.abrir(x.carpeta, true);
			}
		});

		ac.renombra.forEach(function (r) {
			metodos.renombrar(r.d, {
				clase: r.clase.nombre,
				nombre: r.nuevo.nombre,
				tipo: r.nuevo.tipo,
				vis: r.nuevo.vis
			});
			clases.asignarA(r.d.id, r.clase.carpeta);
		});

		ac.nuevos.forEach(function (n) {
			var code = metodos.codigoNuevo(n.clase.nombre, n.nuevo.vis, n.nuevo.tipo, n.nuevo.nombre, n.nuevo.params);
			var d = new Metodo(n.clase.nombre, n.nuevo.nombre, code);
			proy.addDiagram(d);
			clases.asignarA(d.id, n.clase.carpeta);
			n.clase.pares.push({ nuevo: n.nuevo, d: d });
			nuevos.push(d);
		});

		memoria = p.info.map(function (x) {
			return {
				uml: x.el.id,
				carpeta: x.carpeta,
				mets: x.mets.map(function (m) { return m.nombre; })
			};
		});

		metodos.reordenar();
		if (!lienzo.actualDiagram && nuevos.length) {
			lienzo.setDiagram(nuevos[0]);
			arbol.activar(nuevos[0]);
			historial.reset(nuevos[0]);
		}
		arbol.pintar();
		solapas.pintar();
		util.marcarCambios();

		var partes = [];
		if (ac.nuevasClases.length) {
			partes.push(ac.nuevasClases.length === 1 ? "1 clase nueva" : ac.nuevasClases.length + " clases nuevas");
		}
		if (ac.nuevos.length) {
			partes.push(ac.nuevos.length === 1 ? "1 método nuevo" : ac.nuevos.length + " métodos nuevos");
		}
		if (ac.borra.length) {
			partes.push(ac.borra.length === 1 ? "1 método eliminado" : ac.borra.length + " métodos eliminados");
		}
		util.aviso(partes.length
			? "Se actualizó el proyecto: " + partes.join(", ")
			: "El proyecto ya estaba al día con el diagrama UML");
	}

	function firmaDeMetodo(d) {
		var caja = document.createElement("div");
		caja.innerHTML = d.code || "";
		function val(s) {
			var i = caja.querySelector(s + ">.input-for-statement");
			return i ? (i.getAttribute("value") || "") : "";
		}
		var ps = Array.prototype.map.call(caja.querySelectorAll(".method-parameters .parameter-declaration"), function (p) {
			var t = p.querySelector(".type>.input-for-statement");
			var n = p.querySelector(".name>.input-for-statement");
			return ((n ? n.getAttribute("value") : "") || "x") + ": " + ((t ? t.getAttribute("value") : "") || "tipo");
		});
		var signo = { "public": "+", "private": "-", "protected": "#" }[(val(".method-modifiers") || "").split(" ")[0]] || "+";
		return signo + (d.name || "metodo") + "(" + ps.join(", ") + "): " + (val(".method-type") || "void");
	}

	function traerDelNs() {
		actualizarDiagrama();
		var carpetas = clases.todas();
		if (!carpetas.length) {
			util.aviso("El proyecto todavía no tiene clases. Creá una en el panel de la izquierda.");
			return;
		}
		if (elementos.some(function (c) { return c.k === "clase"; }) &&
			!confirm("Se va a rehacer el diagrama UML a partir de las clases y los métodos del proyecto.\n\n" +
				"Las arrastrables de clase y las relaciones que tengas dibujadas se pierden. Las notas se conservan.\n\n" +
				"¿Querés continuar?")) { return; }

		elementos = elementos.filter(function (c) { return c.k === "nota"; });
		relaciones = [];
		memoria = [];
		var col = 0, fila = 0;
		carpetas.forEach(function (f) {
			var mios = metodos.lista().filter(function (d) { return clases.claseDeMetodo(d.id) === f.id; });
			var c = {
				id: util.nuevoId("u"),
				k: "clase",
				x: 40 + col * 260,
				y: 40 + fila * 210,
				w: 220,
				h: 120,
				txt: (f.name || "Clase") + "\n--\n--\n" + mios.map(firmaDeMetodo).join("\n")
			};
			elementos.push(c);
			memoria.push({ uml: c.id, carpeta: f.id, mets: mios.map(function (d) { return d.name || ""; }) });
			col++;
			if (col === 4) { col = 0; fila++; }
		});
		carpetas.forEach(function (f) {
			if (!f.parent) { return; }
			var hijo = memoria.filter(function (r) { return r.carpeta === f.id; })[0];
			var padre = memoria.filter(function (r) { return r.carpeta === f.parent; })[0];
			if (hijo && padre) { relaciones.push({ id: util.nuevoId("r"), de: hijo.uml, a: padre.uml, t: "her", txt: "" }); }
		});
		elegido = null;
		util.marcarCambios();
		pintar();
		util.aviso(carpetas.length === 1
			? "Se dibujó 1 clase a partir del proyecto"
			: "Se dibujaron " + carpetas.length + " clases a partir del proyecto");
	}

	function mostrar(si) {
		vista = !!si;
		document.body.classList.toggle("nsh-uml-on", vista);
		var ns = document.getElementById("sectionDiagram");
		var u = document.getElementById("umlSection");
		if (ns) { ns.classList.toggle("invisible", vista); }
		if (u) { u.classList.toggle("invisible", !vista); }
		var a = document.getElementById("nshViewNS");
		var b = document.getElementById("nshViewUml");
		if (a) { a.classList.toggle("nsh-view-on", !vista); }
		if (b) { b.classList.toggle("nsh-view-on", vista); }
		if (!vista) {
			marcarEspacio(false);
			finPan();
			dedos = {};
			pellizco = null;
		}
		if (vista) { pintar(); }
		acomodarPantalla();
	}

	function zoom(v) {
		nivelZoom = Math.min(2.5, Math.max(0.3, Math.round(v * 100) / 100));
		var casa = lienzoUml();
		if (casa) { casa.style.zoom = nivelZoom; }
		var lv = document.getElementById("umlZoomLevel");
		if (lv) { lv.textContent = Math.round(nivelZoom * 100) + "%"; }
	}

	function zoomHacia(v, cx, cy) {
		var m = plano();
		if (!m) { zoom(v); return; }
		var r = m.getBoundingClientRect();
		var px = (m.scrollLeft + cx - r.left) / nivelZoom;
		var py = (m.scrollTop + cy - r.top) / nivelZoom;
		zoom(v);
		m.scrollLeft = px * nivelZoom - (cx - r.left);
		m.scrollTop = py * nivelZoom - (cy - r.top);
	}

	function zoomCentro(v) {
		var m = plano();
		if (!m) { zoom(v); return; }
		var r = m.getBoundingClientRect();
		zoomHacia(v, r.left + m.clientWidth / 2, r.top + m.clientHeight / 2);
	}

	function ajustar() {
		var m = plano();
		if (!m || !elementos.length) { zoom(1); return; }
		var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
		elementos.forEach(function (c) {
			x1 = Math.min(x1, c.x);
			y1 = Math.min(y1, c.y);
			x2 = Math.max(x2, c.x + c.w);
			y2 = Math.max(y2, c.y + c.h);
		});
		var aire = 40;
		zoom(Math.min(
			m.clientWidth / Math.max(x2 - x1 + aire * 2, 1),
			m.clientHeight / Math.max(y2 - y1 + aire * 2, 1)
		));
		m.scrollLeft = Math.max(0, (x1 - aire) * nivelZoom);
		m.scrollTop = Math.max(0, (y1 - aire) * nivelZoom);
	}

	function cancelarViaje() {
		if (!arrastreActual) { return; }
		window.removeEventListener("pointermove", alMover, true);
		window.removeEventListener("pointerup", alSoltar, true);
		window.removeEventListener("pointercancel", alSoltar, true);
		arrastreActual = null;
		pintar();
	}

	function distancia(a, b) {
		var dx = a.x - b.x, dy = a.y - b.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function alPanear(e) {
		if (!pan) { return; }
		var m = plano();
		if (!m) { return; }
		m.scrollLeft = pan.sl - (e.clientX - pan.x);
		m.scrollTop = pan.st - (e.clientY - pan.y);
		e.preventDefault();
	}

	function finPan() {
		pan = null;
		document.body.classList.remove("nsh-panning");
		window.removeEventListener("pointermove", alPanear, true);
		window.removeEventListener("pointerup", finPan, true);
		window.removeEventListener("pointercancel", finPan, true);
	}

	function arrancarPan(e) {
		var m = plano();
		if (!m) { return; }
		pan = { x: e.clientX, y: e.clientY, sl: m.scrollLeft, st: m.scrollTop };
		document.body.classList.add("nsh-panning");
		window.addEventListener("pointermove", alPanear, true);
		window.addEventListener("pointerup", finPan, true);
		window.addEventListener("pointercancel", finPan, true);
	}

	function alApretarPlano(e) {
		if (!vista) { return; }
		if (e.pointerType === "touch") {
			dedos[e.pointerId] = { x: e.clientX, y: e.clientY };
			var ids = Object.keys(dedos);
			if (ids.length === 2) {
				cancelarViaje();
				var a = dedos[ids[0]], b = dedos[ids[1]];
				pellizco = { d: distancia(a, b), z0: nivelZoom };
				e.stopPropagation();
				e.preventDefault();
			}
			return;
		}
		if (e.button === 1 || (espacio && e.button === 0)) {
			e.stopPropagation();
			e.preventDefault();
			arrancarPan(e);
		}
	}

	function alMoverPlano(e) {
		if (e.pointerType !== "touch" || !dedos[e.pointerId]) { return; }
		dedos[e.pointerId] = { x: e.clientX, y: e.clientY };
		if (!pellizco) { return; }
		var ids = Object.keys(dedos);
		if (ids.length < 2) { return; }
		var a = dedos[ids[0]], b = dedos[ids[1]];
		var d = distancia(a, b);
		if (pellizco.d > 4) {
			zoomHacia(pellizco.z0 * d / pellizco.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
		}
		e.stopPropagation();
		e.preventDefault();
	}

	function alSoltarPlano(e) {
		delete dedos[e.pointerId];
		if (Object.keys(dedos).length < 2) { pellizco = null; }
	}

	function marcarEspacio(si) {
		espacio = si;
		document.body.classList.toggle("nsh-uml-pan", si && vista);
	}

	function nombreUxf() {
		var n = "";
		if (typeof proy !== "undefined" && proy) { n = proy.fullname || proy.name || ""; }
		return (String(n).trim() || "diagrama-uml") + ".uxf";
	}

	function bajarUxf() {
		if (!elementos.length) {
			util.aviso("Agregá al menos una clase o una nota antes de exportar");
			return;
		}
		var nombre = nombreUxf();
		var bolsa = new Blob([uxf.generar(elementos, relaciones)], { type: "application/xml;charset=utf-8" });
		var url = URL.createObjectURL(bolsa);
		var a = document.createElement("a");
		a.href = url;
		a.download = nombre;
		a.style.display = "none";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
		util.aviso("Se guardó el archivo " + nombre);
	}

	function abrirUxf(texto, nombre) {
		var d;
		try {
			d = uxf.leer(texto);
		} catch (e) {
			alert('No se pudo abrir "' + (nombre || "el archivo") + '".\n' +
				"Revisá que sea un .uxf de UMLet o UMLetino.\n\nDetalle: " +
				(e && e.message ? e.message : e));
			return false;
		}
		if ((elementos.length || relaciones.length) &&
			!confirm('Se va a reemplazar el diagrama UML actual por el contenido de "' +
				(nombre || "el archivo") + '".\n\n¿Querés continuar?')) {
			return false;
		}
		elementos = d.cosas;
		relaciones = d.lineas;
		memoria = [];
		elegido = null;
		desde = null;
		uniendo = false;
		mostrar(true);
		ajustar();
		pintar();
		util.marcarCambios();
		util.aviso("Se abrió " + (nombre || "el diagrama") + ": " +
			d.cosas.length + (d.cosas.length === 1 ? " elemento" : " elementos") + " y " +
			d.lineas.length + (d.lineas.length === 1 ? " relación" : " relaciones") +
			(d.sueltas > 0 ? " (se ignoraron " + d.sueltas + " relaciones sueltas)" : ""));
		return true;
	}

	function iniciar() {
		var casa = lienzoUml();
		if (!casa) { return; }
		casa.style.width = ANCHO + "px";
		casa.style.height = ALTO + "px";

		var zona = document.getElementById("umlRelTipos");
		if (zona) {
			VINCULOS.forEach(function (v) {
				var b = document.createElement("button");
				b.type = "button";
				b.className = "uml-tipo";
				b.title = v.nombre;
				b.setAttribute("data-uml-t", v.id);
				b.appendChild(iconoVinculo(v.id));
				b.addEventListener("click", function () { elegirTipo(v.id); });
				zona.appendChild(b);
			});
		}

		var t = panel();
		if (t) {
			t.addEventListener("input", function () {
				var c = elegido ? porId(elegido) : null;
				var l = elegido ? lineaPorId(elegido) : null;
				if (c) { c.txt = t.value; }
				else if (l) { l.txt = t.value; }
				else { return; }
				util.marcarCambios();
				pintar();
			});
			t.addEventListener("keydown", function (e) {
				e.stopPropagation();
				if (e.key === "Escape") { t.blur(); }
			});
		}

		casa.addEventListener("pointerdown", alApretar);
		casa.addEventListener("dblclick", function (e) {
			if (e.target !== casa && e.target !== svg()) { return; }
			var p = puntoEnTela(e);
			nueva("clase", p.x - 100, p.y - 40);
		});

		var botones = {
			"umlNuevaClase": function () { var p = centroVista(); nueva("clase", p.x - 105, p.y - 60); },
			"umlNuevaNota": function () { var p = centroVista(); nueva("nota", p.x - 75, p.y - 35); },
			"umlUnir": tocarUnion,
			"umlBorrar": borrarElegido,
			"umlSync": sincronizar,
			"umlLeer": traerDelNs,
			"umlGuardarUxf": bajarUxf,
			"umlZoomOut": function () { zoomCentro(nivelZoom - 0.1); },
			"umlZoomIn": function () { zoomCentro(nivelZoom + 0.1); },
			"umlZoomReset": function () { zoomCentro(1); },
			"umlZoomFit": ajustar,
			"nshViewNS": function () { mostrar(false); },
			"nshViewUml": function () { mostrar(true); }
		};
		Object.keys(botones).forEach(function (id) {
			var b = document.getElementById(id);
			if (b) { b.addEventListener("click", botones[id]); }
		});

		var m = plano();
		if (m) {
			m.addEventListener("pointerdown", alApretarPlano, true);
			m.addEventListener("pointermove", alMoverPlano, true);
			m.addEventListener("pointerup", alSoltarPlano, true);
			m.addEventListener("pointercancel", alSoltarPlano, true);
			m.addEventListener("wheel", function (e) {
				if (!vista) { return; }
				if (e.ctrlKey || e.metaKey) {
					e.preventDefault();
					zoomHacia(nivelZoom - e.deltaY * 0.0022, e.clientX, e.clientY);
				}
			}, { passive: false });
		}

		document.addEventListener("keydown", alTeclaUml);
		document.addEventListener("keyup", function (e) {
			if (e.code === "Space") { marcarEspacio(false); }
		});
		window.addEventListener("blur", function () {
			marcarEspacio(false);
			dedos = {};
			pellizco = null;
		});

		zoom(1);
		pintar();
	}

	function alTeclaUml(e) {
		if (!vista || util.escribiendo(e.target)) { return; }
		var ctrl = e.ctrlKey || e.metaKey;
		var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
		var p;

		if (e.code === "Space") { e.preventDefault(); marcarEspacio(true); return; }

		if (k === "Delete" || k === "Backspace") { e.preventDefault(); borrarElegido(); return; }
		if (k === "Escape") { uniendo = false; desde = null; elegir(null); return; }

		if (ctrl) {
			if (k === "d") { e.preventDefault(); duplicar(); return; }
			if (k === "g") { e.preventDefault(); sincronizar(); return; }
			if (k === "0") { e.preventDefault(); zoomCentro(1); return; }
			if (k === "9") { e.preventDefault(); ajustar(); return; }
			if (k === "-") { e.preventDefault(); zoomCentro(nivelZoom - 0.1); return; }
			if (k === "+" || k === "=") { e.preventDefault(); zoomCentro(nivelZoom + 0.1); return; }
			return;
		}

		if (k === "c") { e.preventDefault(); p = centroVista(); nueva("clase", p.x - 105, p.y - 60); return; }
		if (k === "n") { e.preventDefault(); p = centroVista(); nueva("nota", p.x - 75, p.y - 35); return; }
		if (k === "r") { e.preventDefault(); tocarUnion(); return; }
		if (k === "Enter" || k === "F2") { e.preventDefault(); editarElegido(); return; }
		if (k === "Tab") { e.preventDefault(); rotarElegido(e.shiftKey ? -1 : 1); return; }

		if (k >= "1" && k <= String(VINCULOS.length)) {
			e.preventDefault();
			elegirTipo(VINCULOS[parseInt(k, 10) - 1].id);
			return;
		}

		var paso = e.shiftKey ? 1 : GRILLA;
		if (k === "ArrowLeft") { if (correrElegido(-paso, 0)) { e.preventDefault(); } return; }
		if (k === "ArrowRight") { if (correrElegido(paso, 0)) { e.preventDefault(); } return; }
		if (k === "ArrowUp") { if (correrElegido(0, -paso)) { e.preventDefault(); } return; }
		if (k === "ArrowDown") { if (correrElegido(0, paso)) { e.preventDefault(); } return; }
	}

	o.iniciar = iniciar;
	o.pintar = function () { if (vista) { pintar(); } };
	o.activo = function () { return vista; };
	o.mostrar = mostrar;
	o.tocarVista = function () { mostrar(!vista); };
	o.sincronizar = sincronizar;
	o.exportarUxf = bajarUxf;
	o.esUxf = function (nombre) { return /\.(uxf|uxl)$/i.test(nombre || ""); };
	o.abrirArchivo = function (f) {
		var lector = new FileReader();
		lector.onload = function (e) { abrirUxf(e.target.result, f.name); };
		lector.readAsText(f);
	};

	o.guardar = function () {
		if (!elementos.length && !relaciones.length && !memoria.length) { return null; }
		return { v: 1, cosas: elementos, lineas: relaciones, mem: memoria };
	};

	o.cargar = function (d) {
		elementos = (d && d.cosas instanceof Array) ? d.cosas : [];
		relaciones = (d && d.lineas instanceof Array) ? d.lineas : [];
		memoria = (d && d.mem instanceof Array) ? d.mem : [];
		elegido = null;
		desde = null;
		uniendo = false;
		if (vista) { pintar(); }
	};

	return o;
}());
