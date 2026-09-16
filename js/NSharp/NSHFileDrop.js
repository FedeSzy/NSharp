var archivos = (function () {
	var o = {};
	var nivel = 0;

	function trae(e) {
		var t = e.dataTransfer && e.dataTransfer.types;
		return t ? Array.prototype.indexOf.call(t, "Files") !== -1 : false;
	}

	function cartel() { return document.getElementById("nshFileDrop"); }

	function mostrar(si) {
		var c = cartel();
		if (c) { c.classList.toggle("invisible", !si); }
	}

	function elegir(files) {
		return Array.prototype.filter.call(files || [], function (f) {
			return /\.nsplus$/i.test(f.name);
		})[0] || null;
	}

	function abrirSoltado(files) {
		var f = elegir(files);
		if (!f) {
			util.aviso("Solo se pueden abrir archivos .nsplus o .uxl");
			return;
		}
		if (util.hayCambios() && !confirm('Hay cambios sin guardar.\n¿Abrir "' + f.name + '" igual?')) { return; }
		leerArchivo(f);
	}

	o.iniciar = function () {
		window.addEventListener("dragenter", function (e) {
			if (!trae(e)) { return; }
			nivel++;
			mostrar(true);
		});
		window.addEventListener("dragover", function (e) {
			if (!trae(e)) { return; }
			e.preventDefault();
			e.dataTransfer.dropEffect = "copy";
		});
		window.addEventListener("dragleave", function (e) {
			if (!trae(e)) { return; }
			nivel--;
			if (nivel <= 0) { nivel = 0; mostrar(false); }
		});
		window.addEventListener("drop", function (e) {
			if (!trae(e)) { return; }
			e.preventDefault();
			nivel = 0;
			mostrar(false);
			abrirSoltado(e.dataTransfer.files);
		});
		window.addEventListener("blur", function () {
			nivel = 0;
			mostrar(false);
		});
	};

	return o;
}());
