var arranque = (function () {
	var o = {};
	var LLAVE = "nsharp.panels";

	function leerPaneles() {
		try {
			return JSON.parse(window.localStorage.getItem(LLAVE)) || { left: true, right: true };
		} catch (e) {
			return { left: true, right: true };
		}
	}

	function guardarPaneles() {
		try {
			window.localStorage.setItem(LLAVE, JSON.stringify({
				left: !document.getElementById("diagramsContainer").classList.contains("invisible"),
				right: !document.getElementById("menuContainer").classList.contains("invisible")
			}));
		} catch (e) { }
	}

	function paneles() {
		var s = leerPaneles();
		if (s.left) { arbol.abrir(); } else { arbol.cerrar(); }
		if (s.right) { abrirPaleta(); } else { cerrarPaleta(); }
		["buttonOpenDiagrams", "buttonCloseDiagrams", "buttonOpenBlocks", "buttonCloseBlocks"].forEach(function (id) {
			var b = document.getElementById(id);
			if (b) { b.addEventListener("click", guardarPaneles); }
		});
	}

	function alPintar() {
		var movidas = util.acomodarDeclaraciones();
		seleccion.ponerCasillas();
		seleccion.pintar();
		util.marcarVacios();
		if (movidas) {
			lienzo.refresh();
			util.aviso(movidas === 1
				? "Se movió una declaración al encabezado del método"
				: "Se movieron " + movidas + " declaraciones al encabezado del método");
		}
	}

	function menuDeclaraciones() {
		var caja = document.getElementById("diagramButtons");
		var envoltorio = caja ? caja.parentNode : null;
		var boton = envoltorio ? envoltorio.querySelector("button") : null;
		if (!boton) { return; }
		var reloj = null;

		document.body.appendChild(caja);

		function poner() {
			var r = boton.getBoundingClientRect();
			var ancho = caja.offsetWidth || 200;
			caja.style.left = Math.max(8, Math.min(r.left, window.innerWidth - ancho - 8)) + "px";
			caja.style.top = Math.round(r.bottom + 4) + "px";
		}

		function abrir() {
			window.clearTimeout(reloj);
			caja.classList.add("nsh-abierto");
			poner();
			window.requestAnimationFrame(poner);
		}

		function cerrar() {
			window.clearTimeout(reloj);
			caja.classList.remove("nsh-abierto");
		}

		function irCerrando() {
			window.clearTimeout(reloj);
			reloj = window.setTimeout(cerrar, 160);
		}

		[envoltorio, caja].forEach(function (n) {
			n.addEventListener("pointerenter", abrir);
			n.addEventListener("pointerleave", irCerrando);
		});
		boton.addEventListener("focus", abrir);
		caja.addEventListener("click", cerrar);
		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape") { cerrar(); }
		});
		window.addEventListener("resize", cerrar);
		window.addEventListener("blur", cerrar);
		document.getElementById("header").addEventListener("scroll", cerrar);
	}

	function botones() {
		var a = document.getElementById("nshUndoBtn");
		var b = document.getElementById("nshRedoBtn");
		var enUml = function () { return typeof uml !== "undefined" && uml.activo(); };
		if (a) { a.addEventListener("click", function () { if (enUml()) { uml.deshacer(); } else { historial.atras(); } }); }
		if (b) { b.addEventListener("click", function () { if (enUml()) { uml.rehacer(); } else { historial.adelante(); } }); }
		var c = document.getElementById("nshChecksBtn");
		if (c) {
			c.addEventListener("click", function () {
				var fijo = document.body.classList.toggle("nsh-force-checks");
				document.body.classList.toggle("nsh-show-checks", fijo || seleccion.cuantos() > 0);
				c.classList.toggle("nsh-active", fijo);
				util.aviso(fijo ? "Las casillas quedan siempre visibles" : "Las casillas aparecen al pasar el mouse");
			});
		}
	}

	o.arrancar = function () {
		if (util.listo) { return; }
		util.listo = true;
		util.alPintar = alPintar;

		tema.iniciar();
		menu.iniciar();
		seleccion.iniciar();
		menuLienzo.iniciar();
		arrastre.iniciar();
		solapas.iniciar();
		buscador.iniciar();
		lupa.iniciar();
		atajos.iniciar();
		creditos.iniciar();
		archivos.iniciar();
		uml.iniciar();
		botones();
		menuDeclaraciones();
		paneles();

		alPintar();
		arbol.pintar();
		solapas.pintar();
		historial.iniciar();
		acomodarPantalla();

		util.actualizarTitulo();
		util.marcarGuardado();
	};

	return o;
}());
