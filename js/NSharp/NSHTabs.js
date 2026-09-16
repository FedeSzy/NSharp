var solapas = (function () {
	var o = {};

	function barra() { return document.getElementById("nshTabs"); }

	function abrir(d) {
		if (!d || d === lienzo.actualDiagram) { return; }
		actualizarDiagrama();
		lienzo.setDiagram(d);
		arbol.activar(d);
		historial.reset(d);
	}

	function renombrar(tab, d) {
		if (tab.querySelector(".nsh-tab-input")) { return; }
		var rot = tab.querySelector(".nsh-tab-label");
		var i = document.createElement("input");
		i.className = "nsh-tab-input";
		i.value = d.name || "";
		rot.style.display = "none";
		tab.insertBefore(i, rot);
		i.focus();
		i.select();

		var hecho = false;
		function cerrar(guardar) {
			if (hecho) { return; }
			hecho = true;
			var v = i.value.trim();
			i.remove();
			rot.style.display = "";
			if (guardar && v && v !== d.name) {
				metodos.renombrar(d, { nombre: v });
				arbol.pintar();
			}
			pintar();
		}
		i.addEventListener("keydown", function (e) {
			e.stopPropagation();
			if (e.key === "Enter") { cerrar(true); }
			else if (e.key === "Escape") { cerrar(false); }
		});
		i.addEventListener("blur", function () { cerrar(true); });
		i.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
	}

	function unaTab(d, n) {
		var tab = document.createElement("div");
		tab.className = "nsh-tab";
		tab.setAttribute("data-nsh-id", d.id);
		tab.title = (d.theClass ? d.theClass + "." : "") + d.name + "()   (Ctrl+" + (n + 1) + ")";

		var rot = document.createElement("span");
		rot.className = "nsh-tab-label";
		if (d.theClass) {
			var c = document.createElement("span");
			c.className = "nsh-tab-class";
			c.textContent = d.theClass + ".";
			rot.appendChild(c);
		}
		rot.appendChild(document.createTextNode(d.name || "sin nombre"));
		tab.appendChild(rot);

		var x = document.createElement("i");
		x.className = "nsh-tab-close fa fa-times";
		x.title = "Eliminar este método";
		x.addEventListener("click", function (e) {
			e.stopPropagation();
			if (confirm("¿Eliminar este método? Se pierde el diagrama que tiene adentro.")) { eliminarMetodo(d); }
		});
		tab.appendChild(x);

		if (d === lienzo.actualDiagram) { tab.classList.add("nsh-tab-active"); }

		tab.addEventListener("click", function () { abrir(d); });
		tab.addEventListener("dblclick", function (e) {
			e.stopPropagation();
			renombrar(tab, d);
		});
		tab.addEventListener("contextmenu", function (e) {
			e.preventDefault();
			menu.abrir(e.clientX, e.clientY, [
				{ title: d.name + "()" },
				{
					label: "Renombrar método", icon: "pencil", key: "F2",
					action: function () { abrir(d); renombrar(tab, d); }
				},
				{
					label: "Renombrar clase", icon: "cube", action: function () {
						var v = prompt("Nombre de la clase:", d.theClass || "");
						if (v !== null && v.trim()) {
							metodos.renombrar(d, { clase: v.trim() });
							arbol.pintar();
							pintar();
						}
					}
				},
				{
					label: "Duplicar", icon: "clone", action: function () {
						var copia = proy.cloneDiagram(metodos.posicionDe(d));
						clases.asignarA(copia.id, clases.claseDeMetodo(d.id));
						abrir(copia);
						arbol.pintar();
						pintar();
					}
				},
				{ separator: true },
				{
					label: "Eliminar método", icon: "trash", danger: true, action: function () {
						if (confirm("¿Eliminar este método? Se pierde el diagrama que tiene adentro.")) { eliminarMetodo(d); }
					}
				}
			]);
		});
		return tab;
	}

	function pintar() {
		var casa = barra();
		if (!casa || casa.querySelector(".nsh-tab-input")) { return; }
		var scroll = casa.scrollLeft;
		casa.innerHTML = "";
		metodos.lista().forEach(function (d, n) { casa.appendChild(unaTab(d, n)); });
		var mas = document.createElement("button");
		mas.id = "nshTabNew";
		mas.type = "button";
		mas.title = "Nuevo método (Ctrl+N)";
		mas.innerHTML = '<i class="fa fa-plus"></i>';
		mas.addEventListener("click", function () { nuevoMetodo(); });
		casa.appendChild(mas);
		casa.scrollLeft = scroll;
		aLaVista();
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
		var l = metodos.lista();
		if (l.length < 2) { return; }
		var i = l.indexOf(lienzo.actualDiagram);
		abrir(l[((i + p) % l.length + l.length) % l.length]);
	}

	function ir(i) {
		var l = metodos.lista();
		if (i >= 0 && i < l.length) { abrir(l[i]); }
	}

	o.pintar = pintar;
	o.abrir = abrir;
	o.pasar = pasar;
	o.ir = ir;
	o.iniciar = function () {
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
