var menu = (function () {
	var o = {};
	var caja = null;

	function cerrar() {
		if (caja && caja.parentNode) { caja.parentNode.removeChild(caja); }
		caja = null;
	}

	function abierto() { return !!caja; }

	function fila(x) {
		if (x.separator) {
			var s = document.createElement("div");
			s.className = "nsh-menu-sep";
			return s;
		}
		if (x.title) {
			var t = document.createElement("div");
			t.className = "nsh-menu-title";
			t.textContent = x.title;
			return t;
		}
		var f = document.createElement("div");
		f.className = "nsh-menu-item" + (x.danger ? " nsh-menu-danger" : "") + (x.disabled ? " nsh-disabled" : "");
		f.innerHTML = '<i class="fa fa-' + (x.icon || "circle-o") + '"></i>' +
			'<span>' + x.label + '</span>' +
			(x.key ? '<span class="nsh-menu-key">' + x.key + '</span>' : "");
		if (!x.disabled) {
			f.addEventListener("click", function (e) {
				e.stopPropagation();
				cerrar();
				x.action();
			});
		}
		return f;
	}

	function abrir(x, y, filas) {
		cerrar();
		if (!filas || !filas.length) { return; }
		caja = document.createElement("div");
		caja.id = "nshContextMenu";
		filas.forEach(function (f) { caja.appendChild(fila(f)); });
		caja.style.left = "0px";
		caja.style.top = "0px";
		document.body.appendChild(caja);

		var r = caja.getBoundingClientRect();
		caja.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + "px";
		caja.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + "px";
	}

	function iniciar() {
		document.addEventListener("pointerdown", function (e) {
			if (caja && !caja.contains(e.target)) { cerrar(); }
		}, true);
		document.addEventListener("scroll", cerrar, true);
		window.addEventListener("blur", cerrar);
		window.addEventListener("resize", cerrar);
	}

	o.abrir = abrir;
	o.cerrar = cerrar;
	o.abierto = abierto;
	o.iniciar = iniciar;

	return o;
}());

var menuLienzo = (function () {
	var o = {};

	function huecoBajo(t) {
		var n = t;
		while (n && n !== util.zonaDiagrama()) {
			if (n.classList && n.classList.contains("empty")) { return n; }
			n = n.parentNode;
		}
		return null;
	}

	function alDerecho(e) {
		var b = util.bloqueDe(e.target);
		var hh = huecoBajo(e.target);
		e.preventDefault();

		if (b && !seleccion.tiene(b)) { seleccion.soloEste(b); }
		if (!b && !e.ctrlKey) { seleccion.limpiarSeleccion(); }

		var n = seleccion.cuantos();
		var destino = hh || (b ? null : seleccion.huecoFinal());
		var filas = [];

		filas.push({ title: n > 1 ? n + " bloques seleccionados" : (b ? "Bloque" : "Método") });

		if (n) {
			filas.push({ label: "Copiar", icon: "clone", key: "Ctrl+C", action: function () { seleccion.copiar(); } });
			filas.push({ label: "Cortar", icon: "scissors", key: "Ctrl+X", action: function () { seleccion.cortar(); } });
			filas.push({ label: "Duplicar", icon: "copy", key: "Ctrl+D", action: function () { seleccion.duplicar(); } });
		}

		filas.push({
			label: "Pegar" + (hh ? " acá" : ""), icon: "clipboard", key: "Ctrl+V",
			disabled: !seleccion.hayPortapapeles(),
			action: function () { seleccion.pegar(destino); }
		});

		if (b) {
			filas.push({ separator: true });
			filas.push({
				label: "Editar el texto", icon: "pencil",
				action: function () {
					var i = b.querySelector(".input-for-statement");
					if (i) { i.focus(); i.select(); }
				}
			});
		}

		filas.push({ separator: true });
		filas.push({ label: "Seleccionar todo", icon: "object-group", key: "Ctrl+A", action: function () { seleccion.todos(); } });
		if (n) {
			filas.push({ label: "Deseleccionar", icon: "ban", key: "Esc", action: function () { seleccion.limpiarSeleccion(); } });
			filas.push({
				label: n > 1 ? "Eliminar los bloques" : "Eliminar el bloque",
				icon: "trash", key: "Supr", danger: true,
				action: function () { seleccion.eliminarElegidos(); }
			});
		}

		menu.abrir(e.clientX, e.clientY, filas);
	}

	o.iniciar = function () {
		var zonaDiagrama = util.zonaDiagrama();
		if (zonaDiagrama) { zonaDiagrama.addEventListener("contextmenu", alDerecho); }
	};

	return o;
}());
