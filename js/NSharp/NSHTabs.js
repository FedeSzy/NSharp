var solapas = (function () {
	var o = {};

	var abiertos = [];
	var actual = null;

	function barra() { return document.getElementById("nshTabs"); }

	function lista(e) {
		var r = [];
		if (e && e.proy) { e.proy.publishTo(function (d) { r.push(d); }); }
		return r;
	}

	function nombre(e) {
		var n = (e.proy.name || "").trim();
		return n || SIN_NOMBRE;
	}

	function entrada(p) {
		return { id: util.nuevoId("p"), proy: p, carpetas: null, dibujo: null, metodo: null, sucio: false, nube: null };
	}

	function hayNube() { return typeof nube !== "undefined"; }

	function soloVer(e) { return hayNube() && nube.rolDe(e) === "lector"; }

	function sinGuardarDe(e) {
		if (e.nube && hayNube()) { return nube.pendiente(e); }
		return e === actual ? util.hayCambios() : e.sucio;
	}

	function vacia(e) {
		if (!e || e !== actual || e.nube || util.hayCambios()) { return false; }
		if (nombre(e) !== SIN_NOMBRE) { return false; }
		if (uml.guardar()) { return false; }
		var l = lista(e);
		return l.length <= 1 && l.every(function (d) { return metodos.cuantosBloques(d) === 0; });
	}

	function abrir(d) {
		if (!d || d === lienzo.actualDiagram) { return; }
		actualizarDiagrama();
		lienzo.setDiagram(d);
		arbol.activar(d);
		historial.reset(d);
	}

	function guardarActual() {
		if (!actual) { return; }
		actualizarDiagrama();
		var l = lista(actual);
		actual.carpetas = clases.paraGuardar(l);
		actual.dibujo = uml.guardar();
		actual.metodo = lienzo.actualDiagram || null;
		actual.sucio = util.hayCambios();
		seleccion.limpiarSeleccion();
		arbol.limpiarSeleccion();
		if (hayNube()) { nube.alDejar(actual); }
	}

	function mostrar(e) {
		actual = e;
		proy = e.proy;
		var l = lista(e);
		clases.desdeArchivo(e.carpetas, l);
		uml.cargar(e.dibujo);
		arbol.vaciarArbol();
		historial.limpiarTodo();
		var d = (e.metodo && l.indexOf(e.metodo) !== -1) ? e.metodo : (l[0] || null);
		lienzo.setDiagram(d);
		arbol.activar(d);
		if (d) { historial.reset(d); }
		util.ponerCambios(e.sucio);
		util.actualizarTitulo();
		pintar();
		if (hayNube()) { nube.alMostrar(e); }
	}

	function ir(e) {
		if (!e || e === actual) { return; }
		guardarActual();
		mostrar(e);
	}

	function quitar(e) {
		var i = abiertos.indexOf(e);
		if (i !== -1) { abiertos.splice(i, 1); }
		if (hayNube()) { nube.soltar(e); }
	}

	function agregar(p, datos) {
		var reemplazo = vacia(actual) ? actual : null;
		guardarActual();
		var e = entrada(p);
		e.carpetas = (datos && datos.carpetas) || null;
		e.dibujo = (datos && datos.dibujo) || null;
		e.nube = (datos && datos.nube) || null;
		abiertos.splice(abiertos.indexOf(actual) + 1, 0, e);
		if (reemplazo) { quitar(reemplazo); }
		mostrar(e);
		return e;
	}

	function nuevo() {
		guardarActual();
		var e = entrada(new Proyecto(par()));
		clases.reset();
		lienzo.setInitialDiagram();
		e.proy.addDiagram(lienzo.actualDiagram);
		e.metodo = lienzo.actualDiagram;
		abiertos.splice(abiertos.indexOf(actual) + 1, 0, e);
		mostrar(e);
		return e;
	}

	function cerrar(e, sinPreguntar) {
		if (!sinPreguntar && sinGuardarDe(e) && !confirm('"' + nombre(e) + '" tiene cambios sin guardar.\n¿Cerrarlo igual?')) { return; }
		var i = abiertos.indexOf(e);
		if (e !== actual) {
			quitar(e);
			pintar();
			return;
		}
		guardarActual();
		quitar(e);
		actual = null;
		var sig = abiertos[Math.min(i, abiertos.length - 1)];
		if (sig) { mostrar(sig); } else { nuevo(); }
	}

	function cerrarOtras(e) {
		ir(e);
		abiertos.slice().forEach(function (x) { if (x !== e) { cerrar(x); } });
	}

	function renombrar(tab, e) {
		if (tab.querySelector(".nsh-tab-input") || soloVer(e)) { return; }
		var rot = tab.querySelector(".nsh-tab-label");
		var i = document.createElement("input");
		i.className = "nsh-tab-input";
		i.value = (e.proy.name || "").trim() === SIN_NOMBRE ? "" : (e.proy.name || "");
		i.placeholder = SIN_NOMBRE;
		rot.style.display = "none";
		tab.insertBefore(i, rot);
		i.focus();
		i.select();

		var hecho = false;
		function listo(guardar) {
			if (hecho) { return; }
			hecho = true;
			var v = i.value.trim();
			i.remove();
			rot.style.display = "";
			if (guardar && v && v !== e.proy.name) {
				e.proy.name = v;
				if (e === actual) { util.marcarCambios(); } else { e.sucio = true; }
				util.actualizarTitulo();
			}
			pintar();
		}
		i.addEventListener("keydown", function (ev) {
			ev.stopPropagation();
			if (ev.key === "Enter") { listo(true); }
			else if (ev.key === "Escape") { listo(false); }
		});
		i.addEventListener("blur", function () { listo(true); });
		i.addEventListener("pointerdown", function (ev) { ev.stopPropagation(); });
	}

	function unaTab(e, n) {
		var tab = document.createElement("div");
		tab.className = "nsh-tab";
		tab.setAttribute("data-nsh-id", e.id);
		tab.title = nombre(e) + (n < 8 ? "   (Ctrl+" + (n + 1) + ")" : "");

		var ico = document.createElement("i");
		ico.className = "nsh-tab-ico fa " + (e.nube ? (soloVer(e) ? "fa-eye" : "fa-cloud") : "fa-file-o");
		ico.title = e.nube ? (soloVer(e) ? "Compartido con vos (solo lectura)" : "Guardado en la cuenta") : "Proyecto local";
		tab.appendChild(ico);

		var rot = document.createElement("span");
		rot.className = "nsh-tab-label";
		rot.textContent = nombre(e);
		tab.appendChild(rot);

		if (sinGuardarDe(e)) { tab.classList.add("nsh-tab-sucia"); }

		var x = document.createElement("i");
		x.className = "nsh-tab-close fa fa-times";
		x.title = "Cerrar el proyecto";
		x.addEventListener("click", function (ev) {
			ev.stopPropagation();
			cerrar(e);
		});
		tab.appendChild(x);

		if (e === actual) { tab.classList.add("nsh-tab-active"); }

		tab.addEventListener("click", function () { ir(e); });
		tab.addEventListener("auxclick", function (ev) {
			if (ev.button === 1) { ev.preventDefault(); cerrar(e); }
		});
		tab.addEventListener("dblclick", function (ev) {
			ev.stopPropagation();
			renombrar(tab, e);
		});
		tab.addEventListener("contextmenu", function (ev) {
			ev.preventDefault();
			menu.abrir(ev.clientX, ev.clientY, [
				{ title: nombre(e) },
				{
					label: "Renombrar proyecto", icon: "pencil", action: function () {
						ir(e);
						var t = barra().querySelector('.nsh-tab[data-nsh-id="' + e.id + '"]');
						if (t) { renombrar(t, e); }
					}
				},
				{
					label: "Compartir", icon: "user-plus", action: function () {
						ir(e);
						compartir.abrir();
					}
				},
				{ separator: true },
				{ label: "Cerrar las demás", icon: "clone", action: function () { cerrarOtras(e); } },
				{ label: "Cerrar", icon: "times", danger: true, action: function () { cerrar(e); } }
			]);
		});
		return tab;
	}

	function pintar() {
		var casa = barra();
		if (!casa || !actual || casa.querySelector(".nsh-tab-input")) { return; }
		var scroll = casa.scrollLeft;
		casa.innerHTML = "";
		abiertos.forEach(function (e, n) { casa.appendChild(unaTab(e, n)); });
		var mas = document.createElement("button");
		mas.id = "nshTabNew";
		mas.type = "button";
		mas.title = "Nuevo proyecto";
		mas.innerHTML = '<i class="fa fa-plus"></i>';
		mas.addEventListener("click", function () { nuevo(); });
		casa.appendChild(mas);
		casa.scrollLeft = scroll;
		aLaVista();
		var s = document.getElementById("nshSoloVer");
		if (s) { s.classList.toggle("invisible", !soloVer(actual)); }
		document.body.classList.toggle("nsh-solo-lectura", soloVer(actual));
	}

	function aLaVista() {
		var casa = barra();
		if (!casa) { return; }
		var act = casa.querySelector(".nsh-tab-active");
		if (!act) { return; }
		var rc = casa.getBoundingClientRect();
		var r = act.getBoundingClientRect();
		if (r.left < rc.left) { casa.scrollLeft -= (rc.left - r.left) + 12; }
		else if (r.right > rc.right) { casa.scrollLeft += (r.right - rc.right) + 12; }
	}

	function pasar(p) {
		if (abiertos.length < 2) { return; }
		var i = abiertos.indexOf(actual);
		ir(abiertos[((i + p) % abiertos.length + abiertos.length) % abiertos.length]);
	}

	function porNumero(i) {
		if (i >= 0 && i < abiertos.length) { ir(abiertos[i]); }
	}

	o.pintar = pintar;
	o.abrir = abrir;
	o.pasar = pasar;
	o.ir = porNumero;
	o.irA = ir;
	o.agregar = agregar;
	o.nuevo = nuevo;
	o.cerrar = cerrar;
	o.lista = lista;
	o.nombre = nombre;
	o.actual = function () { return actual; };
	o.todas = function () { return abiertos.slice(); };
	o.sinGuardar = function () { return abiertos.some(sinGuardarDe); };
	o.iniciar = function () {
		actual = entrada(proy);
		actual.metodo = lienzo.actualDiagram || null;
		abiertos = [actual];
		var b = document.getElementById("nshNuevoProyectoBtn");
		if (b) { b.addEventListener("click", nuevo); }
		var casa = barra();
		if (!casa) { return; }
		casa.addEventListener("wheel", function (e) {
			if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
				casa.scrollLeft += e.deltaY;
				e.preventDefault();
			}
		}, { passive: false });
	};

	return o;
}());
