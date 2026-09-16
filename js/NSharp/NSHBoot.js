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

	function botones() {
		var a = document.getElementById("nshUndoBtn");
		var b = document.getElementById("nshRedoBtn");
		if (a) { a.addEventListener("click", function () { historial.atras(); }); }
		if (b) { b.addEventListener("click", function () { historial.adelante(); }); }
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
