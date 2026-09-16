var lupa = (function () {
	var o = {};
	var LLAVE = "nsharp.zoom";
	var MIN = 0.5;
	var MAX = 2.2;

	var z = 1;
	var espacio = false;
	var paneo = null;

	function marco() { return document.getElementById("nshCanvas"); }

	function dibujo() { return document.getElementById("actualDiagram"); }

	function poner(v) {
		z = Math.min(MAX, Math.max(MIN, Math.round(v * 100) / 100));
		var d = dibujo();
		if (d) { d.style.zoom = z; }
		var t = document.getElementById("nshZoomLevel");
		if (t) { t.textContent = Math.round(z * 100) + "%"; }
		try { window.localStorage.setItem(LLAVE, String(z)); } catch (e) { }
	}

	function acercar(p) { poner(z + p); }

	function cien() { poner(1); }

	function ajustar() {
		var m = marco(), d = dibujo();
		if (!m || !d) { return; }
		var antes = d.style.zoom;
		d.style.zoom = 1;
		var hace = d.scrollWidth + 28;
		d.style.zoom = antes;
		poner(m.clientWidth / Math.max(hace, 1));
	}

	function alRodar(e) {
		if (e.ctrlKey || e.metaKey) {
			e.preventDefault();
			poner(z - e.deltaY * 0.0022);
			return;
		}
		if (e.shiftKey && Math.abs(e.deltaX) < 1) {
			e.preventDefault();
			marco().scrollLeft += e.deltaY;
		}
	}

	function alPanear(e) {
		if (!paneo) { return; }
		e.preventDefault();
		var m = marco();
		m.scrollLeft = paneo.left - (e.clientX - paneo.x);
		m.scrollTop = paneo.top - (e.clientY - paneo.y);
	}

	function finPaneo() {
		paneo = null;
		document.body.classList.remove("nsh-panning");
		window.removeEventListener("pointermove", alPanear, true);
		window.removeEventListener("pointerup", finPaneo, true);
	}

	function alApretar(e) {
		var m = marco();
		if (!m || !m.contains(e.target)) { return; }
		if (e.button === 1 || (espacio && e.button === 0)) {
			e.preventDefault();
			paneo = { x: e.clientX, y: e.clientY, left: m.scrollLeft, top: m.scrollTop };
			document.body.classList.add("nsh-panning");
			window.addEventListener("pointermove", alPanear, true);
			window.addEventListener("pointerup", finPaneo, true);
		}
	}

	function iniciar() {
		var guardado = null;
		try { guardado = window.localStorage.getItem(LLAVE); } catch (e) { guardado = null; }
		poner(guardado ? parseFloat(guardado) : 1);

		var botones = {
			"nshZoomOut": function () { acercar(-0.1); },
			"nshZoomIn": function () { acercar(0.1); },
			"nshZoomReset": cien,
			"nshZoomFit": ajustar
		};
		Object.keys(botones).forEach(function (id) {
			var b = document.getElementById(id);
			if (b) { b.addEventListener("click", botones[id]); }
		});

		var m = marco();
		if (m) { m.addEventListener("wheel", alRodar, { passive: false }); }
		document.addEventListener("pointerdown", alApretar, true);
		document.addEventListener("keydown", function (e) {
			if (e.code === "Space" && !util.escribiendo(e.target)) { espacio = true; }
		});
		document.addEventListener("keyup", function (e) {
			if (e.code === "Space") { espacio = false; }
		});
	}

	o.iniciar = iniciar;
	o.poner = poner;
	o.acercar = acercar;
	o.cien = cien;
	o.ajustar = ajustar;
	o.valor = function () { return z; };

	return o;
}());
