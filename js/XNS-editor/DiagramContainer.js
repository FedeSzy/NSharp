function Lienzo() {
	this.container = document.getElementById("actualDiagram");
	this.actualDiagram;
	this.localVars;
	this.methodParameters;

	this.setDiagram = function (d) {
		this.anterior = this.actualDiagram;
		this.actualDiagram = d;
		if (d) {
			this.container.innerHTML = "";
			this.container.innerHTML = d.code;
			this.reAssignEvents();
			this.refresh();
		} else {
			this.localVars = null;
			this.methodParameters = null;
			this.container.innerHTML = '<div class="nsh-ui nsh-canvas-empty">' +
				'<i class="fa fa-sitemap"></i>' +
				'<p>Todavía no hay ningún método en el proyecto.</p>' +
				'<p>Creá el primero con el botón <b>+</b> del panel de clases, o dibujá las clases en la vista <b>UML</b> y generalas desde ahí.</p></div>';
		}
	}

	this.refresh = function () {
		if (this.actualDiagram) {
			this.actualDiagram.setData(this.diagramClass(), this.diagramName(), util.htmlLimpio(this.container));
		}
	}

	this.setInitialDiagram = function () {
		this.container.innerHTML = "";
		dibujarDiagrama(this.container, plantillaBase);
		this.container.lastChild.appendChild(hueco());
		this.reAssignEvents();
		this.actualDiagram = new Metodo(this.diagramClass(), this.diagramName(), util.htmlLimpio(this.container));
	}

	this.reAssignEvents = function () {
		this.bindVarsAndSignature();
		this.reAssignSwitchEvents();
		this.reAssignDragEvents();
		medirCampos();
		engancharCampos();
		dibujarEsquinas();
		util.alPintar();
	}

	this.bindVarsAndSignature = function () {
		this.localVars = document.querySelector("#actualDiagram .local-variable-declaration");
		this.methodParameters = document.querySelector("#actualDiagram .method-parameters");
	}

	this.appendButtonsInCase = function (caso) {
		caso.firstChild.appendChild(this.newSwitchCaseButton("add"));
		caso.firstChild.appendChild(this.newSwitchCaseButton("remove"));
	}

	this.reAssignSwitchEvents = function () {
		var mas = document.querySelectorAll("#actualDiagram .switch-add-button");
		var menos = document.querySelectorAll("#actualDiagram .switch-remove-button");
		for (let a = 0; a < mas.length; a++) {
			enganchar(mas[a], "click", agregarCaso);
		}
		for (let r = 0; r < menos.length; r++) {
			enganchar(menos[r], "click", quitarCaso);
		}
	}

	this.newSwitchCaseButton = function (tipo) {
		var b = document.createElement("a");
		b.setAttribute("type", "button");
		b.classList.add("switch-button", "switch-" + tipo + "-button");
		if (tipo == "add") {
			b.innerHTML = '<i class="fa fa-sm fa-plus"></i>';
			enganchar(b, "click", agregarCaso);
		} else {
			b.innerHTML = '<i class="fa fa-sm fa-minus"></i>';
			enganchar(b, "click", quitarCaso);
		}
		return b;
	}

	this.makeButtonAddInSwitch = function (bloque) {
		var casos = bloque.lastChild.children;
		for (let c = 0; c < casos.length; c++) {
			this.appendButtonsInCase(casos[c]);
		}
	}

	this.reAssignDragEvents = function () {
		var v = document.querySelectorAll("#actualDiagram [draggable=true]");
		for (let d = 0; d < v.length; d++) {
			hacerArrastrable(v[d]);
		}
	}

	this.diagramClass = function () {
		var i = this.classNameContainer();
		return i ? i.value : "";
	}

	this.diagramName = function () {
		var i = this.methodNameContainer();
		return i ? i.value : "";
	}

	this.classNameContainer = function () {
		return document.querySelector("#actualDiagram .class-name>.input-for-statement");
	}

	this.methodNameContainer = function () {
		return document.querySelector("#actualDiagram .method-name>.input-for-statement");
	}

	this.setInitialDiagram();
}
