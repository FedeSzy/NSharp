var lados = (function () {
	var o = {};
	var LLAVE = "nsharp.anchos";

	var LADOS = {
		izq: { panel: "diagramsContainer", tirador: "nshTiradorIzq", css: "--nsh-ancho-izq", min: 180, max: 560, signo: 1 },
		der: { panel: "menuContainer", tirador: "nshTiradorDer", css: "--nsh-ancho-der", min: 220, max: 600, signo: -1 },
		uml: { panel: "umlProps", tirador: "umlPropsTirador", css: "--uml-ancho-der", min: 220, max: 640, signo: -1 }
	};

	var anchos = {};
	var tiron = null;

	function leer() {
		try {
			return JSON.parse(window.localStorage.getItem(LLAVE)) || {};
		} catch (e) {
			return {};
		}
	}

	function guardar() {
		try { window.localStorage.setItem(LLAVE, JSON.stringify(anchos)); } catch (e) { }
	}

	function tope(l, v) {
		var max = Math.max(l.min, Math.min(l.max, Math.round(window.innerWidth * 0.45)));
		return Math.round(Math.max(l.min, Math.min(max, v)));
	}

	function poner(k, v) {
		var l = LADOS[k];
		if (!l || !isFinite(v)) { return; }
		anchos[k] = tope(l, v);
		document.documentElement.style.setProperty(l.css, anchos[k] + "px");
	}

	function original(k) {
		delete anchos[k];
		document.documentElement.style.removeProperty(LADOS[k].css);
		guardar();
		acomodarPantalla();
	}

	function apretar(k, e) {
		if (e.button !== 0 && e.pointerType === "mouse") { return; }
		var p = document.getElementById(LADOS[k].panel);
		if (!p) { return; }
		e.preventDefault();
		e.stopPropagation();
		tiron = { k: k, x0: e.clientX, w0: p.getBoundingClientRect().width };
		try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) { }
		e.currentTarget.classList.add("nsh-lado-tirando");
		document.body.classList.add("nsh-estirando");
	}

	function mover(e) {
		if (!tiron) { return; }
		e.preventDefault();
		poner(tiron.k, tiron.w0 + (e.clientX - tiron.x0) * LADOS[tiron.k].signo);
	}

	function soltar(e) {
		if (!tiron) { return; }
		tiron = null;
		e.currentTarget.classList.remove("nsh-lado-tirando");
		document.body.classList.remove("nsh-estirando");
		guardar();
		acomodarPantalla();
	}

	function atarTirador(k) {
		var t = document.getElementById(LADOS[k].tirador);
		if (!t) { return; }
		t.addEventListener("pointerdown", function (e) { apretar(k, e); });
		t.addEventListener("pointermove", mover);
		t.addEventListener("pointerup", soltar);
		t.addEventListener("pointercancel", soltar);
		t.addEventListener("lostpointercapture", soltar);
		t.addEventListener("dblclick", function (e) {
			e.preventDefault();
			original(k);
		});
	}

	o.iniciar = function () {
		var s = leer();
		Object.keys(LADOS).forEach(function (k) {
			if (typeof s[k] === "number") { poner(k, s[k]); }
			atarTirador(k);
		});
	};

	return o;
}());
