var tema = (function () {
	var o = {};
	var LLAVE = "nsharp.theme";
	var ATRIB = "data-nsh-theme";

	var LISTA = [
		{ id: "auto", label: "Automático" },
		{ id: "indigo", label: "Claro" },
		{ id: "dark", label: "Oscuro" },
		{ id: "midnight", label: "Negro" },
		{ id: "forest", label: "Verde" },
		{ id: "amber", label: "Naranja" },
		{ id: "rose", label: "Rosa" }
	];

	var actual = "auto";

	function deNoche() {
		return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
	}

	function real(id) { return (id === "auto") ? (deNoche() ? "dark" : "indigo") : id; }

	function esOscuro() {
		var r = real(actual);
		return r === "dark" || r === "midnight";
	}

	function existe(id) {
		return LISTA.some(function (t) { return t.id === id; });
	}

	function poner(id, recordar) {
		if (!existe(id)) { id = "auto"; }
		actual = id;
		document.documentElement.setAttribute(ATRIB, real(id));
		if (recordar !== false) {
			try { window.localStorage.setItem(LLAVE, id); } catch (e) { }
		}
		var s = document.getElementById("nshThemeSelect");
		if (s && s.value !== id) { s.value = id; }
		if (typeof dibujarEsquinas === "function") { dibujarEsquinas(); }
		if (typeof uml !== "undefined" && uml.pintar) { uml.pintar(); }
	}

	function tocar() {
		poner(esOscuro() ? "indigo" : "dark");
		util.aviso(esOscuro() ? "Tema oscuro" : "Tema claro");
	}

	function siguiente() {
		var i = 0;
		LISTA.forEach(function (t, n) { if (t.id === actual) { i = n; } });
		var elegido = LISTA[(i + 1) % LISTA.length];
		poner(elegido.id);
		util.aviso("Tema: " + elegido.label);
	}

	function iniciar() {
		try { actual = window.localStorage.getItem(LLAVE) || "auto"; } catch (e) { actual = "auto"; }
		if (!existe(actual)) { actual = "auto"; }

		var s = document.getElementById("nshThemeSelect");
		if (s) {
			LISTA.forEach(function (t) {
				var op = document.createElement("option");
				op.value = t.id;
				op.textContent = t.label;
				s.appendChild(op);
			});
			s.value = actual;
			s.addEventListener("change", function () { poner(s.value); });
		}

		poner(actual, false);

		if (window.matchMedia) {
			var mq = window.matchMedia("(prefers-color-scheme: dark)");
			var cambio = function () { if (actual === "auto") { poner("auto", false); } };
			if (mq.addEventListener) { mq.addEventListener("change", cambio); }
			else if (mq.addListener) { mq.addListener(cambio); }
		}
	}

	o.iniciar = iniciar;
	o.poner = poner;
	o.tocar = tocar;
	o.siguiente = siguiente;
	o.esOscuro = esOscuro;
	o.lista = LISTA;

	return o;
}());
