var fabrica = new XNSDiagramMaker();
var proy;
var lienzo;
var arbol;
var paleta;
var pdf;
var paramsUrl;
var tacho = document.getElementById("trash");

function armarBloque(def) {
	var obj = fabrica[def.type](def.data);
	obj.setAttribute("type", def.type);
	hacerArrastrable(obj);
	return obj;
}

function hueco() {
	return fabrica.newBlock("empty", undefined, "true");
}

function dibujarDiagrama(caja, json) {
	var d = fabrica.render(caja, json.statements ? json : { statements: [json] });
	caja.classList.add("w3-card-4");
	caja.json = json;
	return d;
}

function hacerArrastrable(obj) {
	obj.setAttribute("draggable", "true");
}

function antesDeAbrir() {
	document.getElementById("inputProjectName").value = proy.name;
	util.actualizarTitulo();
	arbol.vaciarArbol();
	historial.limpiarTodo();
	if (proy.hasDiagrams) {
		var primero = proy.getFirst();
		lienzo.setDiagram(primero);
		arbol.activar(primero);
		engancharCampos();
		medirCampos();
		dibujarEsquinas();
		historial.reset(primero);
	}
	solapas.pintar();
}

function acomodarPantalla() {
	var header = document.getElementById("header");
	var footer = document.getElementById("footer");
	var alto = header.offsetHeight;
	var bajo = footer.offsetHeight;
	document.body.style.paddingTop = alto + "px";
	document.body.style.paddingBottom = bajo + "px";

	var libre = window.innerHeight - alto - bajo;
	["sectionDiagram", "umlSection"].forEach(function (id) {
		var s = document.getElementById(id);
		if (s) { s.style.height = libre + "px"; }
	});

	[document.getElementById("menuContainer"), arbol.container].forEach(function (p) {
		if (p) {
			p.style.top = alto + "px";
			p.style.height = libre + "px";
		}
	});
}

function agregarMetodo(d) {
	proy.addDiagram(d);
	arbol.agregarMetodo(d);
	util.marcarCambios();
}

function eliminarTodos() {
	metodos.lista().forEach(eliminarMetodo);
}

function eliminarMetodo(d) {
	if (!d) { return; }
	var eraElActivo = lienzo.actualDiagram === d;
	var pos = proy.deleteDiagram(d.id);
	clases.olvidar(d.id);
	historial.olvidar(d.id);
	if (eraElActivo) {
		var i = Math.min(Math.max(pos, 0), proy.diagramsCount() - 1);
		var sig = proy.getDiagram(i);
		lienzo.setDiagram(sig);
		if (sig) { historial.reset(sig); }
	}
	arbol.alBorrar();
	arbol.activar(lienzo.actualDiagram);
	util.marcarCambios();
}

function actualizarDiagrama() {
	lienzo.refresh();
	arbol.actualizar(lienzo.actualDiagram);
	historial.anotar();
}

function engancharCampos() {
	var v = document.getElementsByClassName("input-for-statement");
	for (let i = 0; i < v.length; i++) {
		engancharCampo(v[i]);
	}
}

function medirCampos() {
	var v = document.getElementsByClassName("input-for-statement");
	for (let i = 0; i < v.length; i++) {
		medirCampo(v[i]);
	}
}

function engancharCampo(i) {
	enganchar(i, "input", alTipear);
	enganchar(i, "change", alSalir);
}

function medirCampo(i) {
	i.style.width = (i.value.length + 0.5) + "ch";
	var vacio = i.value.length === 0;
	i.classList.toggle("nsh-empty-input", vacio);
	if (vacio) {
		i.setAttribute("placeholder", util.textoDeAyuda(i));
	} else {
		i.removeAttribute("placeholder");
	}
	var casa = i.closest(".block-statement,.input-statement,.output-statement,.call-statement,.return-statement,.comment-statement,.assignment-statement,.condition,.test-value,.content");
	if (casa) {
		casa.classList.toggle("nsh-has-empty", !!casa.querySelector(".nsh-empty-input"));
	}
}

function alTipear(e) {
	medirCampo(this);
}

function alSalir(e) {
	this.setAttribute("value", this.value);
	actualizarDiagrama();
}

function prep() {
	_a = (function(w,x){var z={};for(y in x){z[y]=w[x[y]]};return z})(this, {"emchange":"ub","refresh":"re"});
}

function ver() {
	return (function(x){var z={};for(y in x){w=paramsUrl.get(x[y]);if(w)z[y]=w};return z})({"usr":"usuario","com":"curso","uid":"idusr","evs":"k","eve":"k2","tea":"f"});
}

function eventProc(o) {
	try {_a[o["action"]](proy);}catch(e){}
}

function va(x) {
	return (function(z){
		return _validator.validate(z)})(paramsUrl.get('usuario'));
}

function par() {
	var v = ver();
	v.notify = eventProc;
	return v;
}
function re() { alert(atob("VGllbXBvIGRlIGV4YW1lbiE=")); ub(proy); cl(); }
function cl() { eliminarTodos(); document.getElementById("newDiagram").click() }
function isValidForPop() {
	var x = paramsUrl.get('idusr');
	return (x && isNaN(x));
}

function dibujarEsquinas() {
	var esquinas = document.querySelectorAll(".corner")
	for (let i = 0; i < esquinas.length; i++) {
		const c = esquinas[i];
		var ctx = c.getContext("2d");
		ctx.clearRect(0, 0, c.width, c.height);
		ctx.beginPath();
		if (c.className.includes("true")) {
			ctx.moveTo(-1, -1);
			ctx.lineTo(c.width + 1, c.height + 1);
		} else {
			ctx.moveTo(c.width + 1, -1);
			ctx.lineTo(-1, c.height + 1);
		}
		ctx.lineWidth = 3;
		ctx.strokeStyle = (typeof window != "undefined" && window.getComputedStyle(document.documentElement).getPropertyValue('--nsh-line').trim()) || '#000000';
		ctx.stroke();
	}
}

function armarHistorial() {
	new Globo({
		"popup": globoHist,
		"button": btnHist,
		"open": function (e) { proy.fillHistorial(e.popup) },
		"close": function (e) { if (e.popup) e.popup.innerHTML = "" },
		"visible": false
	})
}

function errorFatal(e) {
	console.error(e);
	vaciar(document.body);
	alert("No se pudo iniciar NS Sharp.\nProbá recargar la página; si sigue igual, avisale al profesor.\n\nDetalle: " + e);
}

function iniciar() {
	try {
		prep();
		paramsUrl = new URLSearchParams(window.location.search);
		enganchar(window, "load", acomodarPantalla);
		enganchar(window, "resize", acomodarPantalla);
		if (!paramsUrl.get("mode")) enganchar(window, "beforeunload", alIrse);
		proy = new Proyecto(par());
		lienzo = new Lienzo();
		arbol = new Arbol();
		paleta = new Paleta();
		pdf = new Pdf();
		enganchar(document.getElementById("inputProjectName"), "change", function () {
			proy.name = this.value;
			util.actualizarTitulo();
			util.marcarCambios();
		});
		iniciarBotones(proy);
		agregarMetodo(lienzo.actualDiagram);
		medirCampos();
		engancharCampos();
		dibujarEsquinas();
		if (isValidForPop()) { armarHistorial(); }
	} catch (e) {
		errorFatal(e);
	}
}

var ub = actualizarBotones;
iniciar();
arranque.arrancar();
