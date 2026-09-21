var tema = (function () {
	var o = {};
	var LLAVE = "nsharp.theme";
	var ATRIB = "data-nsh-theme";

	var LISTA = [
		{ id: "auto", label: "Automático", tinta: "#3f51b5", fondo: "#171a21" },
		{ id: "claro", label: "Claro", tinta: "#3f51b5", fondo: "#eceff4" },
		{ id: "dark", label: "Oscuro", tinta: "#7d8cff", fondo: "#21252e" },
		{ id: "negro", label: "Negro", tinta: "#34d3e0", fondo: "#05070d" },
		{ id: "verde", label: "Verde", tinta: "#00796b", fondo: "#dcf1ed" },
		{ id: "naranja", label: "Naranja", tinta: "#b4581a", fondo: "#fdeade" },
		{ id: "rosa", label: "Rosa", tinta: "#ad1457", fondo: "#fce4ef" }
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

	function porId(id) {
		for (var i = 0; i < LISTA.length; i++) { if (LISTA[i].id === id) { return LISTA[i]; } }
		return LISTA[0];
	}

	function pintarChip(chip, t) {
		chip.style.setProperty("--chip-a", t.tinta);
		chip.style.setProperty("--chip-b", t.fondo);
	}

	function pintarPicker() {
		var t = porId(actual);
		var chip = document.getElementById("nshThemeChip");
		var nombre = document.getElementById("nshThemeNombre");
		if (chip) { pintarChip(chip, t); }
		if (nombre) { nombre.textContent = t.label; }
		util.qq("#nshThemeMenu .nsh-menu-item").forEach(function (b) {
			b.classList.toggle("nsh-menu-elegido", b.getAttribute("data-nsh-tema") === actual);
			b.setAttribute("aria-checked", b.getAttribute("data-nsh-tema") === actual ? "true" : "false");
		});
	}

	function poner(id, recordar) {
		if (!existe(id)) { id = "auto"; }
		actual = id;
		document.documentElement.setAttribute(ATRIB, real(id));
		if (recordar !== false) {
			try { window.localStorage.setItem(LLAVE, id); } catch (e) { }
		}
		pintarPicker();
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

	function armarMenu() {
		var caja = document.getElementById("nshThemeMenu");
		var boton = document.getElementById("nshThemeBtn");
		if (!caja || !boton) { return; }

		caja.setAttribute("role", "menu");
		LISTA.forEach(function (t) {
			var b = document.createElement("button");
			b.type = "button";
			b.className = "nsh-menu-item";
			b.setAttribute("data-nsh-tema", t.id);
			b.setAttribute("role", "menuitemradio");

			var chip = document.createElement("span");
			chip.className = "nsh-chip";
			pintarChip(chip, t);

			var texto = document.createElement("span");
			texto.textContent = t.label;

			var tilde = document.createElement("i");
			tilde.className = "fa fa-check nsh-menu-tilde";

			b.appendChild(chip);
			b.appendChild(texto);
			b.appendChild(tilde);
			b.addEventListener("click", function () { poner(t.id); });
			caja.appendChild(b);
		});

		desplegable.armar(boton, caja, { hover: false });
	}

	function iniciar() {
		try { actual = window.localStorage.getItem(LLAVE) || "auto"; } catch (e) { actual = "auto"; }
		if (!existe(actual)) { actual = "auto"; }

		armarMenu();
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
