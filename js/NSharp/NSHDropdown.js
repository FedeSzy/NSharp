var desplegable = (function () {
	var o = {};
	var todos = [];
	var AIRE = 8;
	var SEPARACION = 6;
	var enganchado = false;

	function pisoDelMenu() {
		var h = document.getElementById("header");
		return h ? h.getBoundingClientRect().bottom : 0;
	}

	function cerrarTodos(menos) {
		todos.forEach(function (m) { if (m !== menos) { m.cerrar(); } });
	}

	function adentro(m, nodo) {
		return m.caja.contains(nodo) || m.boton.contains(nodo) ||
			(m.zona ? m.zona.contains(nodo) : false);
	}

	function engancharGlobales() {
		if (enganchado) { return; }
		enganchado = true;

		document.addEventListener("pointerdown", function (e) {
			todos.forEach(function (m) {
				if (m.abierto() && !adentro(m, e.target)) { m.cerrar(); }
			});
		}, true);

		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape") { cerrarTodos(null); }
		});

		window.addEventListener("resize", function () { cerrarTodos(null); });
		window.addEventListener("blur", function () { cerrarTodos(null); });
		window.addEventListener("scroll", function () { cerrarTodos(null); }, true);
	}

	function armar(boton, caja, opciones) {
		if (!boton || !caja) { return null; }
		var cfg = opciones || {};
		var zona = cfg.zona || boton.parentNode;
		var reloj = null;
		var vivo = false;

		caja.classList.add("nsh-menu");
		if (caja.parentNode !== document.body) { document.body.appendChild(caja); }
		boton.setAttribute("aria-haspopup", "true");
		boton.setAttribute("aria-expanded", "false");

		function ubicar() {
			var r = boton.getBoundingClientRect();
			var ancho = caja.offsetWidth || 200;
			var alto = caja.offsetHeight || 0;
			var x = cfg.derecha ? (r.right - ancho) : r.left;
			var y = Math.max(r.bottom + SEPARACION, pisoDelMenu() + SEPARACION);
			var yTope = Math.max(AIRE, window.innerHeight - alto - AIRE);
			caja.style.left = Math.round(Math.max(AIRE, Math.min(x, window.innerWidth - ancho - AIRE))) + "px";
			caja.style.top = Math.round(Math.min(y, yTope)) + "px";
		}

		function abrir() {
			window.clearTimeout(reloj);
			if (vivo) { ubicar(); return; }
			cerrarTodos(mando);
			vivo = true;
			caja.classList.add("nsh-menu-abierto");
			boton.classList.add("nsh-menu-activo");
			boton.setAttribute("aria-expanded", "true");
			ubicar();
			window.requestAnimationFrame(ubicar);
			if (cfg.alAbrir) { cfg.alAbrir(); }
		}

		function cerrar() {
			window.clearTimeout(reloj);
			if (!vivo) { return; }
			vivo = false;
			caja.classList.remove("nsh-menu-abierto");
			boton.classList.remove("nsh-menu-activo");
			boton.setAttribute("aria-expanded", "false");
		}

		function demorar() {
			window.clearTimeout(reloj);
			reloj = window.setTimeout(cerrar, 200);
		}

		function alternar() { if (vivo) { cerrar(); } else { abrir(); } }

		var mando = {
			abrir: abrir,
			cerrar: cerrar,
			alternar: alternar,
			abierto: function () { return vivo; },
			ubicar: ubicar,
			boton: boton,
			caja: caja,
			zona: zona
		};

		if (cfg.hover !== false) {
			[zona, caja].forEach(function (n) {
				if (!n) { return; }
				n.addEventListener("pointerenter", function (e) {
					if (e.pointerType === "touch") { return; }
					abrir();
				});
				n.addEventListener("pointerleave", function (e) {
					if (e.pointerType === "touch") { return; }
					demorar();
				});
			});
		}

		boton.addEventListener("click", function (e) {
			e.preventDefault();
			alternar();
		});

		if (cfg.cerrarAlElegir !== false) {
			caja.addEventListener("click", function () { cerrar(); });
		}

		todos.push(mando);
		engancharGlobales();
		return mando;
	}

	o.armar = armar;
	o.cerrarTodos = function () { cerrarTodos(null); };

	return o;
}());
