var creditos = (function () {
	var o = {};

	var VIEJOS = [
		{ name: "Prof. C. Daniel Vázquez", github: "axxonita" },
		{ name: "Prof. Carlos E. Cimino", github: "CharlyCimino" }
	];

	var NUEVOS = [
		{ name: "Federico Szymsiowicz" }
	];

	function fila(p) {
		var gh = p.github
			? '<a href="https://github.com/' + p.github + '" target="_blank" rel="noopener">' +
			'<i class="fa fa-github"></i> ' + p.github + "</a>"
			: "";
		return '<li><span class="nsh-credit-name">' + p.name + "</span>" + gh + "</li>";
	}

	function cerrar() {
		var v = document.getElementById("nshCredits");
		if (v) { v.remove(); }
	}

	function mostrar() {
		if (document.getElementById("nshCredits")) { cerrar(); return; }
		var v = document.createElement("div");
		v.id = "nshCredits";
		v.innerHTML = '<div class="nsh-credits-card">' +
			'<img src="img/nsharp-logo-indigo.png" alt="NS Sharp" class="nsh-credits-logo" />' +
			'<p class="nsh-credits-lead">Editor de diagramas de Nassi-Shneiderman extendidos' +
			' para las materias de programación de ORT.</p>' +
			'<h4>NS Plus, la base de este proyecto</h4>' +
			"<ul>" + VIEJOS.map(fila).join("") + "</ul>" +
			'<h4>NS Sharp</h4>' +
			"<ul>" + NUEVOS.map(fila).join("") + "</ul>" +
			'<p class="nsh-credits-foot">Los archivos <b>.nsplus</b> siguen siendo compatibles ' +
			"entre las dos versiones.</p>" +
			'<button type="button" class="nsh-credits-close">Cerrar</button>' +
			"</div>";
		v.addEventListener("click", function (e) {
			if (e.target === v || e.target.classList.contains("nsh-credits-close")) { cerrar(); }
		});
		document.body.appendChild(v);
	}

	o.iniciar = function () {
		var b = document.getElementById("nshCreditsBtn");
		if (b) { b.addEventListener("click", mostrar); }
	};
	o.mostrar = mostrar;
	o.cerrar = cerrar;

	return o;
}());
