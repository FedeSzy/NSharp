function Arbol() {
	var _yo = this;

	this.container = document.getElementById("diagramsContainer");
	this.itemsContainer = document.getElementById("diagramsItemsContainer");
	this.buttonOpenDiagrams = document.getElementById("buttonOpenDiagrams");
	this.buttonCloseDiagrams = document.getElementById("buttonCloseDiagrams");
	this.newFolderButton = document.getElementById("newFolder");
	this.activeId = null;

	var tironcito = null;
	var elegidos = [];
	var ancla = null;

	function esta(id) { return elegidos.indexOf(id) !== -1; }

	function cuantos() { return elegidos.length; }

	function copiar(grupo) {
    if (!grupo.length || !metodos.copiarAlSistema(grupo)) { return; }
    util.aviso(grupo.length === 1 ? "Se copió el método" : "Se copiaron " + grupo.length + " métodos");
	}

	function idsALaVista() {
		return util.qq('.nsh-row[data-nsh-kind="diagram"]', _yo.itemsContainer)
			.map(function (f) { return f.getAttribute("data-nsh-id"); });
	}

	function porId(id) {
		var r = null;
		metodos.lista().forEach(function (d) { if (d.id === id) { r = d; } });
		return r;
	}

	function metsElegidos() {
		return idsALaVista().filter(esta).map(porId).filter(Boolean);
	}

	function pintarElegidos() {
		util.qq('.nsh-row[data-nsh-kind="diagram"]', _yo.itemsContainer).forEach(function (f) {
			f.classList.toggle("nsh-row-selected", esta(f.getAttribute("data-nsh-id")));
		});
		_yo.itemsContainer.classList.toggle("nsh-tree-selecting", elegidos.length > 0);
	}

	function elegir(ids) {
		elegidos = ids.slice();
		ancla = elegidos[elegidos.length - 1] || null;
		if (elegidos.length && typeof seleccion !== "undefined") { seleccion.limpiarSeleccion(); }
		pintarElegidos();
	}

	function limpiarSeleccion() {
		elegidos = [];
		ancla = null;
		if (_yo.itemsContainer) { pintarElegidos(); }
	}

	function tocarElegido(id) {
		var i = elegidos.indexOf(id);
		if (i === -1) {
			elegir(elegidos.concat([id]));
		} else {
			var resto = elegidos.slice();
			resto.splice(i, 1);
			elegir(resto);
			ancla = id;
		}
	}

	function rango(id) {
		var todos = idsALaVista();
		var de = todos.indexOf(ancla), a = todos.indexOf(id);
		if (de === -1 || a === -1) { elegir([id]); return; }
		var viejo = ancla;
		if (de > a) { var x = de; de = a; a = x; }
		elegir(todos.slice(de, a + 1));
		ancla = viejo;
	}

	function alcance(d) {
		if (!d) { return []; }
		if (esta(d.id) && elegidos.length > 1) { return metsElegidos(); }
		return [d];
	}

	function fila(k, id) {
		var f = document.createElement("div");
		f.className = "nsh-row";
		f.setAttribute("data-nsh-kind", k);
		f.setAttribute("data-nsh-id", id);
		return f;
	}

	function icono(cls) {
		var i = document.createElement("i");
		i.className = "nsh-row-icon fa " + cls;
		return i;
	}

	function botoncito(ico, tip, feo, fn) {
		var b = document.createElement("button");
		b.type = "button";
		b.title = tip;
		b.className = feo ? "nsh-del" : "";
		b.innerHTML = '<i class="fa fa-' + ico + '"></i>';
		b.addEventListener("click", function (e) {
			e.stopPropagation();
			fn();
		});
		return b;
	}

	function zonaBotones() {
		var z = document.createElement("div");
		z.className = "nsh-row-actions";
		return z;
	}

	function rotulo(txt, chico) {
		var r = document.createElement("div");
		r.className = "nsh-row-label";
		r.textContent = txt;
		if (chico) {
			var s = document.createElement("small");
			s.textContent = chico;
			r.appendChild(s);
		}
		return r;
	}

	function editarRotulo(f, valor, alGuardar) {
		var r = f.querySelector(".nsh-row-label");
		if (!r || f.querySelector(".nsh-row-edit")) { return; }
		var i = document.createElement("input");
		i.className = "nsh-row-edit";
		i.value = valor;
		r.style.display = "none";
		f.insertBefore(i, r.nextSibling);
		i.focus();
		i.select();

		var hecho = false;
		function cerrar(guardar) {
			if (hecho) { return; }
			hecho = true;
			var v = i.value.trim();
			i.remove();
			r.style.display = "";
			if (guardar && v && v !== valor) { alGuardar(v); }
		}
		i.addEventListener("keydown", function (e) {
			e.stopPropagation();
			if (e.key === "Enter") { cerrar(true); }
			else if (e.key === "Escape") { cerrar(false); }
		});
		i.addEventListener("blur", function () { cerrar(true); });
	}

	function resumen(c, mets) {
		var cuantosMet = mets.filter(function (d) { return clases.claseDeMetodo(d.id) === c.id; }).length;
		var subs = clases.hijas(c.id).length;
		var p = [];
		if (cuantosMet) { p.push(cuantosMet + (cuantosMet === 1 ? " método" : " métodos")); }
		if (subs) { p.push(subs + (subs === 1 ? " subclase" : " subclases")); }
		return p.length ? p.join(" · ") : "vacía";
	}

	function nodoClase(c, mets) {
		var nodo = document.createElement("div");
		nodo.className = "nsh-tree-node " + (c.open ? "nsh-node-open" : "nsh-node-closed");

		var f = fila("folder", c.id);
		var flecha = document.createElement("i");
		flecha.className = "nsh-twisty fa fa-caret-right";
		f.appendChild(flecha);
		f.appendChild(icono(c.open ? "fa-folder-open" : "fa-folder"));
		f.appendChild(rotulo(c.name, resumen(c, mets)));

		var z = zonaBotones();
		z.appendChild(botoncito("plus", "Nueva subclase", false, function () {
			var h = clases.nueva("LaClase", c.id);
			clases.abrir(c.id, true);
			_yo.pintar();
			renombrarClase(h.id);
		}));
		z.appendChild(botoncito("pencil", "Renombrar clase", false, function () { renombrarClase(c.id); }));
		z.appendChild(botoncito("trash", "Eliminar clase", true, function () { sacarClase(c); }));
		f.appendChild(z);

		f.addEventListener("click", function () {
			clases.tocar(c.id);
			_yo.pintar();
		});
		f.addEventListener("dblclick", function (e) {
			e.stopPropagation();
			renombrarClase(c.id);
		});
		f.addEventListener("contextmenu", function (e) {
			e.preventDefault();
			e.stopPropagation();
			menuClase(e, c);
		});

		nodo.appendChild(f);

		var hijos = document.createElement("div");
		hijos.className = "nsh-node-children";
		nivel(c.id, mets, hijos);
		nodo.appendChild(hijos);
		return nodo;
	}

	function renombrarClase(cid) {
		var f = _yo.itemsContainer.querySelector('[data-nsh-kind="folder"][data-nsh-id="' + cid + '"]');
		var c = clases.porId(cid);
		if (!f || !c) { return; }
		editarRotulo(f, c.name, function (v) {
			clases.renombrar(cid, v);
			var tocados = metodos.sincronizarClase(cid);
			util.marcarCambios();
			_yo.pintar();
			solapas.pintar();
			if (tocados) {
				util.aviso(tocados === 1
					? 'Un método pasó a la clase "' + v + '"'
					: tocados + ' métodos pasaron a la clase "' + v + '"');
			}
		});
	}

	function sacarClase(c) {
		if (!confirm('¿Eliminar la clase "' + c.name + '"?\n\nLos métodos que tiene adentro no se borran: pasan al nivel de arriba.')) { return; }
		clases.eliminar(c.id);
		metodos.reordenar();
		util.marcarCambios();
		_yo.pintar();
	}

	function menuClase(e, c) {
		menu.abrir(e.clientX, e.clientY, [
			{ title: c.name },
			{ label: "Renombrar", icon: "pencil", key: "F2", action: function () { renombrarClase(c.id); } },
			{
				label: "Nueva subclase", icon: "folder-o",
				action: function () {
					var h = clases.nueva("LaClase", c.id);
					clases.abrir(c.id, true);
					_yo.pintar();
					renombrarClase(h.id);
				}
			},
			{
				label: "Nuevo método en esta clase", icon: "plus-circle",
				action: function () {
					nuevoMetodo();
					clases.abrir(c.id, true);
					metodos.mover(lienzo.actualDiagram, c.id, null);
					_yo.pintar();
					solapas.pintar();
				}
			},
			{ separator: true },
			{ label: "Eliminar clase", icon: "trash", danger: true, action: function () { sacarClase(c); } }
		]);
	}

	function nodoMetodo(d) {
		var nodo = document.createElement("div");
		nodo.className = "nsh-tree-node";

		var f = fila("diagram", d.id);
		var tilde = document.createElement("span");
		tilde.className = "nsh-row-check";
		tilde.title = "Seleccionar este método";
		tilde.addEventListener("pointerdown", function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (e.shiftKey && ancla) { rango(d.id); } else { tocarElegido(d.id); }
		});
		tilde.addEventListener("click", function (e) { e.stopPropagation(); });
		f.appendChild(tilde);
		f.appendChild(icono("fa-file-code-o"));
		f.appendChild(rotulo(metodos.rotulo(d), metodos.claseDe(d) ? "class " + d.theClass : ""));

		var z = zonaBotones();
		z.appendChild(botoncito("clone", "Duplicar", false, function () { clonar(d); }));
		z.appendChild(botoncito("files-o", "Copiar", false, function () { copiar(alcance(d)); }));
		z.appendChild(botoncito("trash", "Eliminar", true, function () { sacarMetodos(alcance(d)); }));
		f.appendChild(z);

		if (d === lienzo.actualDiagram) { f.classList.add("nsh-row-active"); }
		if (esta(d.id)) { f.classList.add("nsh-row-selected"); }

		f.addEventListener("click", function (e) {
			if (e.ctrlKey || e.metaKey) { tocarElegido(d.id); return; }
			if (e.shiftKey) { rango(d.id); return; }
			elegir([d.id]);
			abrirMetodo(d);
		});
		f.addEventListener("dblclick", function (e) {
			e.stopPropagation();
			renombrarMetodo(d);
		});
		f.addEventListener("contextmenu", function (e) {
			e.preventDefault();
			e.stopPropagation();
			menuMetodo(e, d);
		});

		nodo.appendChild(f);
		return nodo;
	}

	function abrirMetodo(d) {
		if (d === lienzo.actualDiagram) { return; }
		actualizarDiagrama();
		lienzo.setDiagram(d);
		_yo.activar(d);
		historial.reset(d);
	}

	function pegarDelSistema(e) {
	if (util.escribiendo(e.target)) { return; }
	var txt = e.clipboardData ? e.clipboardData.getData("text/plain") : "";
	var carga = null;
	try {
		var j = JSON.parse(txt);
		if (j && j.tag === metodos.FIRMA && j.methods instanceof Array) { carga = j.methods; }
	} catch (x) { carga = null; }
	if (!carga || !carga.length) { return; }
	e.preventDefault();
	var nuevos = carga.map(function (m) {
		var d = new Metodo(m.clase || "", m.nombre || "sin nombre", m.code);
		proy.addDiagram(d);
		return d;
	});
	util.marcarCambios();
	_yo.pintar();
	solapas.pintar();
	abrirMetodo(nuevos[nuevos.length - 1]);
	util.aviso(nuevos.length === 1 ? "Se pegó el método" : "Se pegaron " + nuevos.length + " métodos");
	}

	function renombrarMetodo(d) {
		var f = _yo.itemsContainer.querySelector('[data-nsh-kind="diagram"][data-nsh-id="' + d.id + '"]');
		if (!f) { return; }
		editarRotulo(f, d.name || "", function (v) {
			metodos.renombrar(d, { nombre: v });
			_yo.pintar();
			solapas.pintar();
		});
	}

	function renombrarClaseDe(d) {
		var v = prompt("Nombre de la clase:", d.theClass || "");
		if (v !== null && v.trim()) {
			metodos.renombrar(d, { clase: v.trim() });
			_yo.pintar();
			solapas.pintar();
		}
	}

	function sacarMetodos(l) {
		if (!l.length) { return; }
		var pregunta = l.length === 1
			? "¿Eliminar este método? Se pierde el diagrama que tiene adentro."
			: "¿Eliminar los " + l.length + " métodos seleccionados? Se pierden los diagramas que tienen adentro.";
		if (!confirm(pregunta)) { return; }
		l.forEach(eliminarMetodo);
		limpiarSeleccion();
		_yo.pintar();
		solapas.pintar();
		if (l.length > 1) { util.aviso("Se eliminaron " + l.length + " métodos"); }
	}

	function moverVarios(l, cid, antes) {
		l.forEach(function (d) { metodos.mover(d, cid, antes); });
		util.marcarCambios();
	}

	function clonar(d) {
		var i = metodos.posicionDe(d);
		if (i === -1) { return; }
		var copia = proy.cloneDiagram(i);
		clases.asignarA(copia.id, clases.claseDeMetodo(d.id));
		actualizarDiagrama();
		lienzo.setDiagram(copia);
		_yo.activar(copia);
		historial.reset(copia);
		_yo.pintar();
		solapas.pintar();
	}

	function menuMetodo(e, d) {
		var grupo = alcance(d);
		var varios = grupo.length > 1;
		var filas = [];

		filas.push({ title: varios ? grupo.length + " métodos seleccionados" : metodos.rotulo(d) });

		if (!varios) {
			filas.push({ label: "Abrir", icon: "folder-open-o", action: function () { abrirMetodo(d); } });
			filas.push({ label: "Renombrar método", icon: "pencil", key: "F2", action: function () { renombrarMetodo(d); } });
			filas.push({ label: "Renombrar clase", icon: "cube", action: function () { renombrarClaseDe(d); } });
			filas.push({ label: "Duplicar", icon: "clone", action: function () { clonar(d); } });
			filas.push({ label: "Copiar", icon: "files-o", key: "Ctrl+C", action: function () { copiar(grupo); } });
			filas.push({ separator: true });
			filas.push({
				label: "Subir", icon: "arrow-up",
				action: function () { if (metodos.correr(d, -1)) { _yo.pintar(); solapas.pintar(); } }
			});
			filas.push({
				label: "Bajar", icon: "arrow-down",
				action: function () { if (metodos.correr(d, 1)) { _yo.pintar(); solapas.pintar(); } }
			});
		}

		var todasLasClases = clases.todas();
		if (todasLasClases.length) {
			filas.push({ separator: true });
			filas.push({ title: varios ? "Mover los " + grupo.length + " a" : "Mover a" });
			todasLasClases.forEach(function (c) {
				filas.push({
					label: c.name, icon: "folder",
					disabled: grupo.length === 1 && clases.claseDeMetodo(d.id) === c.id,
					action: function () {
						clases.abrir(c.id, true);
						moverVarios(grupo, c.id, null);
						_yo.pintar();
						solapas.pintar();
					}
				});
			});
		}

		filas.push({ separator: true });
		filas.push({
			label: varios ? "Sacar de su clase" : "Sacar de la clase", icon: "level-up",
			disabled: !grupo.some(function (x) { return clases.claseDeMetodo(x.id); }),
			action: function () {
				moverVarios(grupo, null, null);
				_yo.pintar();
				solapas.pintar();
			}
		});
		if (varios) {
			filas.push({ label: "Deseleccionar", icon: "ban", key: "Esc", action: limpiarSeleccion });
		}
		filas.push({
			label: varios ? "Eliminar los " + grupo.length + " métodos" : "Eliminar método",
			icon: "trash", danger: true,
			action: function () { sacarMetodos(grupo); }
		});

		menu.abrir(e.clientX, e.clientY, filas);
	}

	function nivel(pid, mets, destino) {
		clases.hijas(pid).forEach(function (c) { destino.appendChild(nodoClase(c, mets)); });
		mets.forEach(function (d) {
			if (clases.claseDeMetodo(d.id) === pid) { destino.appendChild(nodoMetodo(d)); }
		});
	}

	this.pintar = function () {
		if (!_yo.itemsContainer) { return; }
		if (_yo.itemsContainer.querySelector(".nsh-row-edit")) { return; }
		var scroll = _yo.itemsContainer.scrollTop;
		_yo.itemsContainer.innerHTML = "";
		var mets = metodos.lista();
		if (!mets.length && !clases.todas().length) {
			var v = document.createElement("div");
			v.className = "nsh-tree-empty";
			v.innerHTML = "Todavía no hay clases ni métodos.<br>Creá el primer método con el botón <b>+</b>.";
			_yo.itemsContainer.appendChild(v);
			return;
		}
		nivel(null, mets, _yo.itemsContainer);
		_yo.itemsContainer.scrollTop = scroll;
		pintarElegidos();
	};

	this.cuantos = cuantos;
	this.limpiarSeleccion = limpiarSeleccion;

	this.borrarElegidos = function () {
		var grupo = metsElegidos();
		if (!grupo.length) { return false; }
		sacarMetodos(grupo);
		return true;
	};

	this.copiarElegidos = function () { copiar(metsElegidos()); };

	function filaBajo(x, y) {
		var el = document.elementFromPoint(x, y);
		while (el && el !== _yo.itemsContainer) {
			if (el.classList && el.classList.contains("nsh-row")) { return el; }
			el = el.parentNode;
		}
		return null;
	}

	function limpiarPistas() {
		util.qq(".nsh-drop-into,.nsh-drop-before,.nsh-drop-after", _yo.itemsContainer).forEach(function (f) {
			f.classList.remove("nsh-drop-into", "nsh-drop-before", "nsh-drop-after");
		});
	}

	function plan(f, y) {
		var r = f.getBoundingClientRect();
		var k = f.getAttribute("data-nsh-kind");
		var p = (y - r.top) / r.height;
		if (k === "folder" && p > 0.25 && p < 0.75) { return { fila: f, donde: "into" }; }
		return { fila: f, donde: p < 0.5 ? "before" : "after" };
	}

	function siguienteA(d) {
		var l = metodos.lista();
		var i = l.indexOf(d);
		return (i !== -1 && i + 1 < l.length) ? l[i + 1] : null;
	}

	function soltarEnArbol(p) {
		if (!p || !tironcito) { return; }
		var k = p.fila.getAttribute("data-nsh-kind");
		var id = p.fila.getAttribute("data-nsh-id");
		if (tironcito.kind === "diagram") {
			var mueve = tironcito.mets.filter(Boolean);
			if (!mueve.length) { return; }
			if (p.donde === "into" && k === "folder") {
				clases.abrir(id, true);
				moverVarios(mueve, id, null);
			} else if (k === "diagram") {
				var ref = porId(id);
				if (!ref || mueve.indexOf(ref) !== -1) { return; }
				var antes = p.donde === "before" ? ref : siguienteA(ref);
				moverVarios(mueve, clases.claseDeMetodo(ref.id), antes);
			} else {
				var c = clases.porId(id);
				moverVarios(mueve, c ? c.parent : null, null);
			}
		} else if (tironcito.kind === "folder") {
			if (tironcito.id === id) { return; }
			if (p.donde === "into" && k === "folder") {
				if (clases.ubicar(tironcito.id, id, null)) { clases.abrir(id, true); }
			} else if (k === "folder") {
				var hermana = clases.porId(id);
				clases.ubicar(tironcito.id, hermana.parent, p.donde === "before" ? id : null);
			} else {
				var vecino = porId(id);
				clases.ubicar(tironcito.id, vecino ? clases.claseDeMetodo(vecino.id) : null, null);
			}
			metodos.reordenar();
		}
		util.marcarCambios();
		_yo.pintar();
		solapas.pintar();
	}

	function alApretarArbol(e) {
		if (e.button !== 0 && e.pointerType === "mouse") { return; }
		if (e.target.closest(".nsh-row-actions,.nsh-row-edit,.nsh-row-check")) { return; }
		var f = e.target.closest(".nsh-row");
		if (!f) { return; }
		var k = f.getAttribute("data-nsh-kind");
		var id = f.getAttribute("data-nsh-id");
		if (k === "diagram" && (e.ctrlKey || e.metaKey || e.shiftKey)) { return; }
		tironcito = {
			kind: k,
			id: id,
			mets: k === "diagram" ? alcance(porId(id)) : [],
			fila: f,
			x0: e.clientX,
			y0: e.clientY,
			activo: false,
			plan: null
		};
		window.addEventListener("pointermove", alMoverArbol, true);
		window.addEventListener("pointerup", alSoltarArbol, true);
	}

	function alMoverArbol(e) {
		if (!tironcito) { return; }
		if (!tironcito.activo) {
			if (Math.abs(e.clientY - tironcito.y0) + Math.abs(e.clientX - tironcito.x0) < 6) { return; }
			tironcito.activo = true;
			document.body.classList.add("nsh-dragging");
		}
		e.preventDefault();
		limpiarPistas();
		var f = filaBajo(e.clientX, e.clientY);
		tironcito.plan = null;
		if (f && f !== tironcito.fila) {
			var p = plan(f, e.clientY);
			tironcito.plan = p;
			f.classList.add("nsh-drop-" + p.donde);
		}
	}

	function alSoltarArbol() {
		window.removeEventListener("pointermove", alMoverArbol, true);
		window.removeEventListener("pointerup", alSoltarArbol, true);
		if (!tironcito) { return; }
		var estaba = tironcito.activo;
		var p = tironcito.plan;
		limpiarPistas();
		document.body.classList.remove("nsh-dragging");
		if (estaba) {
			soltarEnArbol(p);
			var tapar = function (e) {
				e.stopPropagation();
				e.preventDefault();
				window.removeEventListener("click", tapar, true);
			};
			window.addEventListener("click", tapar, true);
			window.setTimeout(function () { window.removeEventListener("click", tapar, true); }, 60);
		}
		tironcito = null;
	}

	this.agregarMetodo = function (d) {
		_yo.activar(d);
		_yo.pintar();
		solapas.pintar();
	};

	this.vaciarArbol = function () {
		_yo.activeId = null;
		if (_yo.itemsContainer) { _yo.itemsContainer.innerHTML = ""; }
	};

	this.actualizar = function (d) {
		if (!d) { return; }
		_yo.pintar();
		solapas.pintar();
	};

	this.activar = function (d) {
		_yo.activeId = d ? d.id : null;
		_yo.pintar();
		solapas.pintar();
	};

	this.alBorrar = function () {
		_yo.pintar();
		solapas.pintar();
	};

	function zonas() {
		return [document.getElementById("sectionDiagram"), document.getElementById("umlSection")].filter(Boolean);
	}

	this.abrir = function () {
		ponerClase(false, "invisible", _yo.container);
		zonas().forEach(function (s) {
			ponerClase(false, "initial-margin-left", s);
			ponerClase(true, "margin-left", s);
		});
		ponerClase(true, "invisible", _yo.buttonOpenDiagrams);
	};

	this.cerrar = function () {
		ponerClase(true, "invisible", _yo.container);
		zonas().forEach(function (s) {
			ponerClase(true, "initial-margin-left", s);
			ponerClase(false, "margin-left", s);
		});
		ponerClase(false, "invisible", _yo.buttonOpenDiagrams);
	};

	this.nuevaClase = function () {
		var c = clases.nueva("LaClase", null);
		util.marcarCambios();
		_yo.pintar();
		renombrarClase(c.id);
	};

	this.renombrarActual = function () {
		if (lienzo.actualDiagram) { renombrarMetodo(lienzo.actualDiagram); }
	};

	enganchar(_yo.buttonOpenDiagrams, "click", _yo.abrir);
	enganchar(_yo.buttonCloseDiagrams, "click", _yo.cerrar);
	if (_yo.newFolderButton) {
		enganchar(_yo.newFolderButton, "click", _yo.nuevaClase);
	}

	document.addEventListener("paste", pegarDelSistema);

	if (_yo.itemsContainer) {
		_yo.itemsContainer.addEventListener("pointerdown", alApretarArbol);
		_yo.itemsContainer.addEventListener("click", function (e) {
			if (e.target === _yo.itemsContainer || e.target.classList.contains("nsh-tree-empty")) { limpiarSeleccion(); }
		});
		_yo.itemsContainer.addEventListener("contextmenu", function (e) {
			if (e.target === _yo.itemsContainer || e.target.classList.contains("nsh-tree-empty")) {
				e.preventDefault();
				menu.abrir(e.clientX, e.clientY, [
					{ title: "Proyecto" },
					{ label: "Nuevo método", icon: "plus-circle", action: nuevoMetodo },
					{ label: "Nueva clase", icon: "folder-o", action: _yo.nuevaClase }
				]);
			}
		});
	}
}
