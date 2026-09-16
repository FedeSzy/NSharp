var buscador = (function () {
	var o = {};

	var COSAS = {
		"input": { label: "Entrada", keys: "entrada leer ingresar pedir input scanner cargar" },
		"output": { label: "Salida", keys: "salida mostrar imprimir escribir print output" },
		"comment": { label: "Comentario", keys: "comentario nota aclaracion" },
		"block": { label: "Instrucción", keys: "instruccion bloque proceso accion sentencia" },
		"assignment": { label: "Asignación", keys: "asignacion asignar variable igual guardar" },
		"if": { label: "Si / Sino", keys: "si sino condicional condicion decision if else" },
		"conditional": { label: "Si / Sino", keys: "si sino condicional condicion decision if else" },
		"switch": { label: "Según", keys: "segun caso casos selector multiple switch case" },
		"while": { label: "Mientras", keys: "mientras repetir bucle ciclo while repeticion condicion" },
		"dowhile": { label: "Hacer... mientras", keys: "hacer mientras repetir dowhile ciclo bucle condicion" },
		"for": { label: "Para", keys: "para desde hasta paso contador for bucle ciclo" },
		"foreach": { label: "Para cada", keys: "para cada recorrer coleccion lista foreach bucle" },
		"call": { label: "Llamada", keys: "llamada llamar invocar funcion metodo procedimiento call" },
		"return": { label: "Retorno", keys: "retornar devolver return resultado salir" },
		"break": { label: "Cortar (break)", keys: "break cortar salir interrumpir" },
		"try": { label: "Try", keys: "try intentar excepcion error" },
		"catch": { label: "Catch", keys: "catch capturar excepcion error" },
		"finally": { label: "Finally", keys: "finally finalmente excepcion" },
		"throw": { label: "Throw", keys: "throw lanzar excepcion error" },
		"newParameter": { label: "Parámetro", keys: "parametro argumento" },
		"newVariable": { label: "Variable", keys: "variable local declaracion" },
		"newConstant": { label: "Constante", keys: "constante final" },
		"newInitializedVariable": { label: "Variable inicializada", keys: "variable inicializada declaracion" },
		"newInitializedConstant": { label: "Constante inicializada", keys: "constante final inicializada" }
	};

	var TOPES = { clase: 6, metodo: 8, bloque: 14, paleta: 8 };
	var ROTULOS = { parameter: "Parámetro", local: "Variable" };
	var TITULOS = {
		clase: "Clases",
		metodo: "Métodos",
		bloque: "Bloques del proyecto",
		paleta: "Agregar un bloque"
	};

	var indice = null;
	var salio = [];
	var marcado = -1;

	function infoDelTipo(t) { return COSAS[t] || { label: t, keys: t }; }

	function campoBusqueda() { return document.getElementById("nshFindInput"); }

	function lista() { return document.getElementById("nshFindResults"); }

	function textoDe(b) {
		var partes = [];
		Array.prototype.forEach.call(b.querySelectorAll(".input-for-statement"), function (i) {
			if (i.closest('[draggable="true"]') !== b) { return; }
			var v = i.getAttribute("value") || i.value || "";
			if (v) { partes.push(v); }
		});
		return partes.join(" ");
	}

	function bloquesDe(d) {
		var caja = document.createElement("div");
		caja.innerHTML = d.code || "";
		var r = [];
		Array.prototype.forEach.call(caja.querySelectorAll('[draggable="true"]'), function (b) {
			if (!b.id) { return; }
			var k = util.tipoDeclaracion(b);
			var t = b.getAttribute("type") || k || "";
			var info = k ? { label: ROTULOS[k], keys: k } : infoDelTipo(t);
			var txt = textoDe(b);
			r.push({
				kind: "bloque",
				label: txt || info.label,
				detail: info.label + " · " + (d.theClass ? d.theClass + "." : "") + d.name + "()",
				haystack: util.sinAcentos([txt, info.label, info.keys, d.theClass, d.name].join(" ")),
				metodo: d,
				bid: b.id,
				icon: "th-large"
			});
		});
		return r;
	}

	function armarIndice() {
		if (typeof proy === "undefined" || !proy) { return []; }
		if (typeof lienzo !== "undefined" && lienzo.actualDiagram) { lienzo.refresh(); }
		var r = [];

		clases.todas().forEach(function (c) {
			r.push({
				kind: "clase",
				label: c.name,
				detail: "Clase",
				haystack: util.sinAcentos(c.name + " clase"),
				carpeta: c,
				icon: "folder"
			});
		});

		metodos.lista().forEach(function (d) {
			r.push({
				kind: "metodo",
				label: (d.name || "sin nombre") + "()",
				detail: d.theClass ? "class " + d.theClass : "Método",
				haystack: util.sinAcentos((d.name || "") + " " + (d.theClass || "") + " metodo"),
				metodo: d,
				icon: "file-code-o"
			});
			r = r.concat(bloquesDe(d));
		});

		paletaDefs.forEach(function (g) {
			g.items.forEach(function (x) {
				var info = infoDelTipo(x.type);
				r.push({
					kind: "paleta",
					label: info.label,
					detail: "Agregar al método abierto",
					haystack: util.sinAcentos(info.label + " " + info.keys + " " + x.type + " insertar nuevo"),
					plantilla: JSON.stringify(x),
					type: x.type,
					icon: "plus-square-o"
				});
			});
		});

		return r;
	}

	function tirarIndice() { indice = null; }

	function buscar(txt) {
		var palabras = util.sinAcentos(txt).trim().split(/\s+/).filter(Boolean);
		if (!palabras.length) { return []; }
		if (!indice) { indice = armarIndice(); }
		var pegan = indice.filter(function (x) {
			return palabras.every(function (p) { return x.haystack.indexOf(p) !== -1; });
		});
		var usados = { clase: 0, metodo: 0, bloque: 0, paleta: 0 };
		var orden = { clase: 0, metodo: 1, bloque: 2, paleta: 3 };
		return pegan.filter(function (x) {
			usados[x.kind]++;
			return usados[x.kind] <= TOPES[x.kind];
		}).sort(function (a, b) { return orden[a.kind] - orden[b.kind]; });
	}

	function flash(el) {
		if (!el) { return; }
		el.classList.add("nsh-found");
		window.setTimeout(function () { el.classList.remove("nsh-found"); }, 1600);
	}

	function aLaClase(x) {
		arbol.abrir();
		var padre = x.carpeta.parent;
		while (padre) {
			clases.abrir(padre, true);
			padre = (clases.porId(padre) || {}).parent;
		}
		clases.abrir(x.carpeta.id, true);
		arbol.pintar();
		var f = document.querySelector('.nsh-row[data-nsh-kind="folder"][data-nsh-id="' + x.carpeta.id + '"]');
		if (f) {
			f.scrollIntoView({ block: "center", behavior: "smooth" });
			flash(f);
		}
	}

	function alMetodo(x) {
		solapas.abrir(x.metodo);
		arbol.abrir();
		var f = document.querySelector('.nsh-row[data-nsh-kind="diagram"][data-nsh-id="' + x.metodo.id + '"]');
		if (f) {
			f.scrollIntoView({ block: "center", behavior: "smooth" });
			flash(f);
		}
	}

	function alBloque(x) {
		solapas.abrir(x.metodo);
		var b = document.getElementById(x.bid);
		if (!b) {
			util.aviso("No se encontró ese bloque");
			return;
		}
		b.scrollIntoView({ block: "center", behavior: "smooth" });
		seleccion.soloEste(b);
		flash(b);
		var i = b.querySelector(".input-for-statement");
		if (i) { i.focus(); i.select(); }
	}

	function usar(x) {
		if (!x) { return; }
		cerrar();
		if (x.kind === "clase") { aLaClase(x); }
		else if (x.kind === "metodo") { alMetodo(x); }
		else if (x.kind === "bloque") { alBloque(x); }
		else if (x.kind === "paleta") { arrastre.insertarPlantilla(x.plantilla, null); tirarIndice(); }
	}

	function fila(x, n) {
		var f = document.createElement("div");
		f.className = "nsh-find-item nsh-find-" + x.kind;
		f.setAttribute("data-nsh-index", n);
		f.innerHTML = '<i class="fa fa-' + x.icon + '"></i>' +
			'<span class="nsh-find-label"></span>' +
			'<span class="nsh-find-detail"></span>';
		f.querySelector(".nsh-find-label").textContent = x.label;
		f.querySelector(".nsh-find-detail").textContent = x.detail;

		if (x.kind === "paleta") {
			f.classList.add("nsh-palette-item");
			var lleva = document.createElement("span");
			lleva.setAttribute("draggable", "true");
			lleva.className = "nsh-find-carrier";
			lleva.template = x.plantilla;
			f.appendChild(lleva);
			f.title = "Hacé click para agregarlo, o arrastralo hasta el diagrama";
		}
		f.addEventListener("click", function () {
			if (typeof arrastre !== "undefined" && arrastre.huboArrastre()) { return; }
			usar(x);
		});
		f.addEventListener("mousemove", function () { marcar(n, true); });
		return f;
	}

	function ubicarLista() {
		var caja = lista();
		var casa = document.getElementById("nshFind");
		if (!caja || !casa) { return; }
		var r = casa.getBoundingClientRect();
		var ancho = Math.min(380, window.innerWidth - 16);
		caja.style.width = ancho + "px";
		caja.style.left = Math.max(8, Math.min(r.left, window.innerWidth - ancho - 8)) + "px";
		caja.style.top = (r.bottom + 6) + "px";
		caja.style.maxHeight = (window.innerHeight - r.bottom - 24) + "px";
	}

	function pintar() {
		var caja = lista();
		if (!caja) { return; }
		ubicarLista();
		caja.innerHTML = "";
		if (!salio.length) {
			var v = document.createElement("div");
			v.className = "nsh-find-empty";
			v.textContent = campoBusqueda().value.trim() ? "Sin resultados" : "";
			caja.appendChild(v);
			caja.classList.toggle("invisible", !campoBusqueda().value.trim());
			return;
		}
		var ultimo = null;
		salio.forEach(function (x, n) {
			if (x.kind !== ultimo) {
				ultimo = x.kind;
				var t = document.createElement("div");
				t.className = "nsh-find-group";
				t.textContent = TITULOS[x.kind];
				caja.appendChild(t);
			}
			caja.appendChild(fila(x, n));
		});
		caja.classList.remove("invisible");
		marcar(0);
	}

	function marcar(n, callado) {
		var caja = lista();
		if (!caja || !salio.length) { marcado = -1; return; }
		marcado = ((n % salio.length) + salio.length) % salio.length;
		util.qq(".nsh-find-item", caja).forEach(function (f) {
			f.classList.toggle("nsh-find-marked", parseInt(f.getAttribute("data-nsh-index"), 10) === marcado);
		});
		if (!callado) {
			var act = caja.querySelector(".nsh-find-marked");
			if (act) { act.scrollIntoView({ block: "nearest" }); }
		}
	}

	function buscarAhora() {
		salio = buscar(campoBusqueda().value);
		pintar();
	}

	function cerrar() {
		var caja = lista();
		if (caja) { caja.classList.add("invisible"); }
		marcado = -1;
	}

	function limpiarBusqueda() {
		var i = campoBusqueda();
		if (i) { i.value = ""; }
		salio = [];
		cerrar();
	}

	function abrir() {
		var i = campoBusqueda();
		if (!i) { return; }
		tirarIndice();
		i.focus();
		i.select();
		if (i.value.trim()) { buscarAhora(); }
	}

	function alTeclear(e) {
		if (e.key === "Escape") {
			e.preventDefault();
			if (campoBusqueda().value) { limpiarBusqueda(); } else { campoBusqueda().blur(); }
			return;
		}
		if (e.key === "ArrowDown") { e.preventDefault(); marcar(marcado + 1); return; }
		if (e.key === "ArrowUp") { e.preventDefault(); marcar(marcado - 1); return; }
		if (e.key === "Enter") { e.preventDefault(); usar(salio[marcado]); }
	}

	function iniciar() {
		var i = campoBusqueda();
		if (!i) { return; }
		i.addEventListener("input", util.retrasar(buscarAhora, 120));
		i.addEventListener("keydown", alTeclear);
		i.addEventListener("focus", function () {
			tirarIndice();
			if (i.value.trim()) { buscarAhora(); }
		});
		var x = document.getElementById("nshFindClear");
		if (x) {
			x.addEventListener("click", function () { limpiarBusqueda(); i.focus(); });
		}
		document.addEventListener("pointerdown", function (e) {
			var casa = document.getElementById("nshFind");
			if (casa && !casa.contains(e.target)) { cerrar(); }
		}, true);
		window.addEventListener("resize", function () {
			if (!lista().classList.contains("invisible")) { ubicarLista(); }
		});
	}

	o.infoDelTipo = infoDelTipo;
	o.iniciar = iniciar;
	o.abrir = abrir;
	o.cerrar = cerrar;
	o.limpiarBusqueda = limpiarBusqueda;
	o.tirarIndice = tirarIndice;

	return o;
}());
