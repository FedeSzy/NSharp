function botonDeclaracion(e) {
	if (!util.hayMetodo()) {
		util.aviso("Abrí un método antes de agregar parámetros o variables");
		return;
	}
	var boton = e.currentTarget || e.target;
	var id = boton.id;
	var i = posicionEntreHermanos(boton);

	var obj = fabrica[id](declPlantillas[i]);
	hacerArrastrable(obj);
	switch (i) {
		case 0:
			obj.innerHTML = (lienzo.methodParameters.hasChildNodes() ? " , " : "") + obj.innerHTML;
			lienzo.methodParameters.appendChild(obj);
			break;
		case 1:
			lienzo.localVars.insertBefore(obj, lienzo.localVars.firstChild);
			break;
		default:
			lienzo.localVars.appendChild(obj);
			break;
	}
	engancharCampos();
	medirCampos();
	actualizarDiagrama();
}

function alternarColores(e) {
	var link = document.getElementById("css/NSPColors.css");
	link.setAttribute("href", (e.target.checked ? link.id : ""));
}

function verTodos(e) {
	alert("La vista de todos los métodos juntos todavía no está disponible.");
}

function casoDelBoton(e) {
	var b = e.currentTarget || e.target;
	return b.closest(".case");
}

function agregarCaso(e) {
	var caso = casoDelBoton(e);
	if (!caso) {
		return;
	}
	var nuevo = fabrica["switch-case"](casoPlantilla);
	lienzo.appendButtonsInCase(nuevo);
	caso.parentNode.insertBefore(nuevo, caso);
	medirCampos();
	actualizarDiagrama();
}

function quitarCaso(e) {
	var caso = casoDelBoton(e);
	if (!caso) {
		return;
	}
	if (caso.parentNode.children.length <= 1) {
		util.aviso("El bloque Según tiene que tener al menos un caso");
		return;
	}
	caso.remove();
	actualizarDiagrama();
}

function nuevoMetodo(e) {
	actualizarDiagrama();
	lienzo.setInitialDiagram();
	agregarMetodo(lienzo.actualDiagram);
	engancharCampos();
	medirCampos();
	dibujarEsquinas();
	historial.reset(lienzo.actualDiagram);
}

function abrirPaleta(e) {
	ponerClase(false, "invisible", document.getElementById("menuContainer"));
	ponerClase(false, "initial-margin-right", document.getElementById("sectionDiagram"));
	ponerClase(true, "margin-right", document.getElementById("sectionDiagram"));
	ponerClase(true, "invisible", document.getElementById("buttonOpenBlocks"));
}

function cerrarPaleta(e) {
	ponerClase(true, "invisible", document.getElementById("menuContainer"));
	ponerClase(true, "initial-margin-right", document.getElementById("sectionDiagram"));
	ponerClase(false, "margin-right", document.getElementById("sectionDiagram"));
	ponerClase(false, "invisible", document.getElementById("buttonOpenBlocks"));
}

function cerrarVentana() {
	window.close();
}

function alIrse(e) {
	if (!util.hayCambios()) {
		return;
	}
	e.preventDefault();
	e.returnValue = '';
	return '';
}
