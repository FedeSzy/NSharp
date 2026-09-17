function abrirProyecto() {
	var input = document.getElementById('fileInput');
	input.onchange = e => {
		var f = e.target.files[0];
		input.value = '';
		if (!f) { return; }
		if (typeof uml != "undefined" && uml.esUxf(f.name)) {
			uml.abrirArchivo(f);
			return;
		}
		leerArchivo(f);
	}
	input.value = '';
	input.click();
}

var SIN_NOMBRE = "Proyecto sin título";

function tieneNombre() {
	var n = (proy && proy.name) ? String(proy.name).trim() : "";
	return !!n && n !== SIN_NOMBRE;
}

// El nombre se pide recién al guardar, y una sola vez por proyecto.
function pedirNombre() {
	var n = prompt("Nombre del proyecto:", "");
	if (n === null) { return false; }
	n = n.trim();
	if (!n) {
		util.aviso("Es necesario un nombre para guardar el proyecto");
		return false;
	}
	proy.name = n;
	util.actualizarTitulo();
	return true;
}

function nombreDeArchivo() {
	return String(proy.fullname).replace(/[\\/:*?"<>|]/g, "-");
}

function guardarProyecto() {
	if (!tieneNombre() && !pedirNombre()) { return; }
	var obj = proy.getForExport(true, actualizarDiagrama);
	var a = document.createElement('a');
	a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj)));
	a.setAttribute('download', nombreDeArchivo() + ".nsplus");
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	util.marcarGuardado();
	util.aviso("Se guardó el archivo " + nombreDeArchivo() + ".nsplus");
}

function pdfAlumno() {
	exportarPdf(false);
}

function pdfSimple() {
	exportarPdf(true);
}

function hojasCss() {
	var v = ['css/w3.css', 'css/NSPDiagram.css', 'css/NSPEditor.css', 'css/NSPPDF.css'];
	if (document.getElementById('checkColors').checked) {
		v.push('css/NSPColors.css');
	}
	return v;
}

function exportarPdf(simple) {
	actualizarDiagrama();
	proy.updateTime();
	pdf.setProject(proy, simple);
	var w = window.open();
	w.document.write(htmlPdf());
}

function htmlPdf() {
	return '<html data-nsh-theme="indigo">' + cabezaPdf() + '<body><div id="projectPrint">'
		+ pdf.container.innerHTML + '</div></body><script>' + dibujarEsquinas
		+ 'window.onafterprint = function(){window.close();};dibujarEsquinas();setTimeout(() => {window.print();}, 200);</script></html>';
}

function cabezaPdf() {
	var head = '<head><title>' + proy.name + ' - NS Sharp</title>';
	var hojas = window.document.styleSheets;
	for (let i = 0; i < hojas.length; i++) {
		head += '<link rel="stylesheet" type="text/css" href="' + hojas[i].href + '" />'
	}
	return head + "</head>";
}

function leerArchivo(f) {
	var lector = new FileReader();
	lector.onload = (function (elArchivo) {
		return function (e) {
			var abierto = null;
			try {
				abierto = jsonAProyecto(aJson(e.target.result));
			} catch (error) {
				alert("No se pudo abrir el archivo.\nRevisá que sea un .nsplus válido.\n\nDetalle: " + error);
				return;
			}
			proy = abierto;
			antesDeAbrir();
			util.marcarGuardado();
			util.aviso('Se abrió "' + elArchivo.name + '"');
		};
	})(f);
	lector.readAsText(f);
}

function jsonAProyecto(json) {
	var p = new Proyecto(ver());
	p.import(json);
	return p;
}

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
	alert('Este navegador no permite abrir ni guardar archivos. Probá con Chrome, Firefox o Edge.');
}
