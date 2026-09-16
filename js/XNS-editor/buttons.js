var btnAbrir = document.getElementById("importProjectBtn");
var btnGuardar = document.getElementById("exportProjectBtn");
var btnPdf = document.getElementById("exportPDFBtn");
var btnSalir = document.getElementById("exitBtn");

var btnNuevo = document.getElementById("newDiagram");
var btnVerTodo = document.getElementById("viewAllDiagrams");

var tildeColor = document.getElementById("checkColors");

var btnHist = document.getElementById("historialBtn");
var globoHist = document.getElementById("hist-popup");

var btnAbrirPaleta = document.getElementById("buttonOpenBlocks");
var btnCerrarPaleta = document.getElementById("buttonCloseBlocks");

function iniciarBotones(p) {
	if (!p) return;

	enganchar(btnGuardar, "click", guardarProyecto);
	enganchar(btnAbrir, "click", abrirProyecto);
	(!p.et) ? enganchar(btnPdf, "click", pdfAlumno) : btnPdf.className += " disabled";

	var decls = document.getElementById("diagramButtons").children;
	for (let b = 0; b < decls.length; b++) {
		enganchar(decls[b], "click", botonDeclaracion);
	}

	enganchar(btnNuevo, "click", nuevoMetodo);
	enganchar(btnVerTodo, "click", verTodos);
	enganchar(tildeColor, "click", alternarColores);

	enganchar(btnAbrirPaleta, "click", abrirPaleta);
	enganchar(btnCerrarPaleta, "click", cerrarPaleta);

	enganchar(btnSalir, "click", cerrarVentana);
}

function actualizarBotones(p) {
	if (!p) return;
	if (p.et) {
		desenganchar(btnPdf, "click", pdfAlumno);
		btnPdf.className += " disabled";
	} else {
		enganchar(btnPdf, "click", pdfAlumno);
		btnPdf.className = btnPdf.className.replace(" disabled", "");
	}
}
