var uxf = (function () {
	var o = {};


	var LT = {
		aso: "lt=-",
		dir: "lt=->",
		her: "lt=->>",
		imp: "lt=.>>",
		agr: "lt=<<<<-",
		com: "lt=<<<<<-",
		dep: "lt=.>"
	};

	var ESTILO = /^\s*(lt|bg|fg|lw|group|layer|fontsize|halign|valign|transparency|style|elementstyle|customelement|type|m1|m2|r1|r2|q1|q2)\s*=/i;

	var CERCA = 40;

	function esc(s) {
		return String(s == null ? "" : s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	function un(v) { return (Math.round(v * 10) / 10).toFixed(1); }

	function porId(cosas, id) {
		for (var i = 0; i < cosas.length; i++) { if (cosas[i].id === id) { return cosas[i]; } }
		return null;
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

	function bloque(id, x, y, w, h, panel, extra) {
		return "  <element>\n" +
			"    <id>" + id + "</id>\n" +
			"    <coordinates>\n" +
			"      <x>" + Math.round(x) + "</x>\n" +
			"      <y>" + Math.round(y) + "</y>\n" +
			"      <w>" + Math.round(w) + "</w>\n" +
			"      <h>" + Math.round(h) + "</h>\n" +
			"    </coordinates>\n" +
			"    <panel_attributes>" + esc(panel) + "</panel_attributes>\n" +
			"    <additional_attributes>" + esc(extra || "") + "</additional_attributes>\n" +
			"  </element>\n";
	}

	o.generar = function (cosas, lineas) {
		var t = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
			'<diagram program="umletino" version="15.1">\n' +
			"  <zoom_level>10</zoom_level>\n";

		(cosas || []).forEach(function (c) {
			t += bloque(c.k === "nota" ? "UMLNote" : "UMLClass", c.x, c.y, c.w, c.h, c.txt || "", "");
		});

		(lineas || []).forEach(function (l) {
			var a = porId(cosas, l.de), b = porId(cosas, l.a);
			if (!a || !b) { return; }
			var p1 = borde(marco(a), b.x + b.w / 2, b.y + b.h / 2);
			var p2 = borde(marco(b), a.x + a.w / 2, a.y + a.h / 2);
			var x = Math.min(p1.x, p2.x) - 10;
			var y = Math.min(p1.y, p2.y) - 10;
			var panel = (LT[l.t] || LT.aso) + (l.txt ? "\n" + l.txt : "");
			var puntos = un(p1.x - x) + ";" + un(p1.y - y) + ";" + un(p2.x - x) + ";" + un(p2.y - y);
			t += bloque("Relation", x, y,
				Math.abs(p2.x - p1.x) + 20, Math.abs(p2.y - p1.y) + 20, panel, puntos);
		});

		return t + "</diagram>\n";
	};

	function hijo(n, tag) {
		if (!n) { return ""; }
		var h = n.getElementsByTagName(tag)[0];
		return h ? (h.textContent || "") : "";
	}

	function numero(n, tag) {
		var v = parseFloat(hijo(n, tag));
		return isNaN(v) ? 0 : v;
	}

	function textoLimpio(panel) {
		var lineas = String(panel || "").split(/\r?\n/).filter(function (l) { return !ESTILO.test(l); });
		while (lineas.length && !lineas[lineas.length - 1].trim()) { lineas.pop(); }
		while (lineas.length && !lineas[0].trim()) { lineas.shift(); }
		return lineas.join("\n");
	}

	function valorLt(panel) {
		var lt = "";
		String(panel || "").split(/\r?\n/).forEach(function (l) {
			var m = l.match(/^\s*lt\s*=\s*(.*)$/i);
			if (m) { lt = m[1].trim(); }
		});
		return lt.replace(/\[[^\]]*\]/g, "");
	}

	function tipoDeLt(panel) {
		var s = valorLt(panel);
		var iz = (s.match(/^<+/) || [""])[0].length;
		var der = (s.match(/>+$/) || [""])[0].length;
		var fuerte = Math.max(iz, der);
		var alInicio = iz > der;
		var punteada = s.indexOf(".") !== -1;
		var t;

		if (fuerte >= 5) { t = "com"; }
		else if (fuerte === 4) { t = "agr"; }
		else if (fuerte >= 2) { t = punteada ? "imp" : "her"; }
		else if (fuerte === 1) { t = punteada ? "dep" : "dir"; }
		else { t = punteada ? "dep" : "aso"; }

		// El rombo va del lado de origen; el triángulo y la flecha, del lado de destino.
		var invertir = false;
		if (fuerte >= 4) { invertir = !alInicio; }
		else if (fuerte >= 1) { invertir = alInicio; }

		return { t: t, invertir: invertir };
	}

	function cajaCerca(cosas, p) {
		var mejor = null, corta = Infinity;
		cosas.forEach(function (c) {
			var dx = Math.max(c.x - p.x, 0, p.x - (c.x + c.w));
			var dy = Math.max(c.y - p.y, 0, p.y - (c.y + c.h));
			var d = Math.sqrt(dx * dx + dy * dy);
			if (d < corta) { corta = d; mejor = c; }
		});
		return corta <= CERCA ? mejor : null;
	}

	o.leer = function (texto) {
		var doc = new DOMParser().parseFromString(String(texto || ""), "text/xml");
		if (!doc || doc.getElementsByTagName("parsererror").length) {
			throw new Error("el archivo no es un XML válido");
		}
		var raiz = doc.getElementsByTagName("diagram")[0];
		if (!raiz) { throw new Error("no tiene la etiqueta <diagram> de UMLet"); }

		var escala = 10 / (parseFloat(hijo(raiz, "zoom_level")) || 10);
		var cosas = [];
		var crudas = [];

		Array.prototype.forEach.call(doc.getElementsByTagName("element"), function (el) {
			var tipo = (hijo(el, "id") || "").trim();
			var co = el.getElementsByTagName("coordinates")[0];
			var x = numero(co, "x") * escala;
			var y = numero(co, "y") * escala;
			var w = numero(co, "w") * escala;
			var h = numero(co, "h") * escala;
			var panel = hijo(el, "panel_attributes");

			if (tipo === "Relation") {
				var v = (hijo(el, "additional_attributes") || "").split(";")
					.map(parseFloat).filter(function (n) { return !isNaN(n); });
				if (v.length < 4) { return; }
				crudas.push({
					panel: panel,
					p1: { x: x + v[0], y: y + v[1] },
					p2: { x: x + v[v.length - 2], y: y + v[v.length - 1] }
				});
				return;
			}

			var nota = tipo !== "UMLClass" && tipo !== "UMLInterface";
			cosas.push({
				id: util.nuevoId("u"),
				k: nota ? "nota" : "clase",
				x: Math.max(0, Math.round(x / 10) * 10),
				y: Math.max(0, Math.round(y / 10) * 10),
				w: Math.max(nota ? 90 : 120, Math.round(w / 10) * 10),
				h: Math.max(50, Math.round(h / 10) * 10),
				txt: textoLimpio(panel)
			});
		});

		var lineas = [];
		crudas.forEach(function (r) {
			var a = cajaCerca(cosas, r.p1);
			var b = cajaCerca(cosas, r.p2);
			if (!a || !b || a === b) { return; }
			var q = tipoDeLt(r.panel);
			lineas.push({
				id: util.nuevoId("r"),
				de: (q.invertir ? b : a).id,
				a: (q.invertir ? a : b).id,
				t: q.t,
				txt: textoLimpio(r.panel).split(/\r?\n/)[0] || ""
			});
		});

		if (!cosas.length) { throw new Error("no tiene clases ni notas"); }
		return { cosas: cosas, lineas: lineas, sueltas: crudas.length - lineas.length };
	};

	return o;
}());
