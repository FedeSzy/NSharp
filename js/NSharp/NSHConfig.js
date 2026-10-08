var configuracion = (function () {
	var o = {};
	var LLAVE_COLOR = "nsharp.colores";
	var LLAVE_CASILLAS = "nsharp.casillas";

	var mando = null;
	var aplicando = false;

	function leer(llave) {
		try { return window.localStorage.getItem(llave); } catch (e) { return null; }
	}

	function anotar(llave, valor) {
		try { window.localStorage.setItem(llave, valor); } catch (e) { }
	}

	function ponerColores(si) {
		var t = document.getElementById("checkColors");
		var link = document.getElementById("css/NSPColors.css");
		if (t) { t.checked = si; }
		if (link) { link.setAttribute("href", si ? link.id : ""); }
		anotar(LLAVE_COLOR, si ? "si" : "no");
		guardar();
	}

	function ponerCasillas(si, avisar) {
		document.body.classList.toggle("nsh-force-checks", si);
		document.body.classList.toggle("nsh-show-checks", si || seleccion.cuantos() > 0);
		var t = document.getElementById("nshChecksCheck");
		if (t) { t.checked = si; }
		anotar(LLAVE_CASILLAS, si ? "si" : "no");
		guardar();
		if (avisar) {
			util.aviso(si ? "Las casillas quedan siempre visibles" : "Las casillas aparecen al pasar el mouse");
		}
	}

	function tocarCasillas() {
		ponerCasillas(!document.body.classList.contains("nsh-force-checks"), true);
	}

	function cerrar() { if (mando) { mando.cerrar(); } }

	function preferencias() {
		var t = document.getElementById("checkColors");
		return {
			tema: tema.actual(),
			colores: t ? t.checked : true,
			casillas: document.body.classList.contains("nsh-force-checks")
		};
	}

	function refCuenta() {
		var u = typeof cuenta !== "undefined" ? cuenta.usuario() : null;
		var db = u ? cuenta.base() : null;
		return db ? db.collection("usuarios").doc(u.uid) : null;
	}

	function guardar() {
		if (aplicando) { return; }
		var ref = refCuenta();
		if (ref) { ref.set({ config: preferencias() }, { merge: true }).catch(function () { }); }
	}

	function aplicar(x) {
		aplicando = true;
		try {
			if (typeof x.tema === "string") { tema.poner(x.tema); }
			if (typeof x.colores === "boolean") { ponerColores(x.colores); }
			if (typeof x.casillas === "boolean") { ponerCasillas(x.casillas, false); }
		} finally {
			aplicando = false;
		}
	}

	function alUsuario(u) {
		var ref = u ? refCuenta() : null;
		if (!ref) { return; }
		ref.get().then(function (s) {
			var x = s.exists ? s.data().config : null;
			if (x) { aplicar(x); } else { guardar(); }
		}).catch(function () { });
	}

	o.iniciar = function () {
		mando = desplegable.armar(
			document.getElementById("nshConfigBtn"),
			document.getElementById("nshConfigMenu"),
			{ hover: false, cerrarAlElegir: false, derecha: true }
		);

		var colores = document.getElementById("checkColors");
		if (colores) {
			colores.addEventListener("change", function () { ponerColores(colores.checked); });
		}
		ponerColores(leer(LLAVE_COLOR) !== "no");

		var casillas = document.getElementById("nshChecksCheck");
		if (casillas) {
			casillas.addEventListener("change", function () { ponerCasillas(casillas.checked, true); });
		}
		ponerCasillas(leer(LLAVE_CASILLAS) === "si", false);

		["nshHelpBtn", "nshCreditsBtn"].forEach(function (id) {
			var b = document.getElementById(id);
			if (b) { b.addEventListener("click", cerrar); }
		});

		cuenta.alCambiar(alUsuario);
	};
	o.tocarCasillas = tocarCasillas;
	o.cerrar = cerrar;
	o.guardar = guardar;

	return o;
}());
