function Paleta() {
	var _yo = this;

	this.container = document.getElementById("nshMenuScroll") || document.getElementById("menuContainer");

	this.newAccordion = function (id) {
		var a = document.createElement("div");
		a.id = id;
		a.classList.add("w3-bar-block", "w3-hide", "w3-white", "w3-card-4", "nsh-accordion");
		a.setAttribute("data-nsh-open", "0");
		return a;
	};

	this.newAccordionButton = function (txt) {
		var b = document.createElement("button");
		b.classList.add("w3-button", "w3-block", "w3-hover-indigo", "w3-leftbar", "w3-border-indigo", "w3-section", "w3-card-4");
		b.setAttribute("data-nsh-acc", txt);
		b.innerHTML = txt;
		enganchar(b, "click", _yo.toggleAccordion);
		return b;
	};

	this.toggleAccordion = function () {
		var a = document.getElementById(this.getAttribute("data-nsh-acc"));
		if (!a) {
			return;
		}
		alternarClase(a, "w3-show");
		a.setAttribute("data-nsh-open", a.classList.contains("w3-show") ? "1" : "0");
	};

	this.fillAccordion = function (a, items) {
		for (var i = 0; i < items.length; i++) {
			var def = items[i];
			var muestra = armarBloque(def);
			muestra.template = JSON.stringify(def);
			a.appendChild(_yo.newMenuItem(muestra, def));
		}
	};

	this.newMenuItem = function (muestra, def) {
		var info = buscador.infoDelTipo(def.type);
		var b = document.createElement("div");
		b.setAttribute("type", "button");
		b.classList.add("w3-bar-item", "w3-button", "w3-hover-light-gray", "nsh-palette-item");
		b.setAttribute("data-nsh-type", def.type);
		b.title = info.label + " — arrastralo al diagrama, o hacé click para agregarlo al final";

		var n = document.createElement("div");
		n.className = "nsh-palette-name";
		n.textContent = info.label;
		b.appendChild(n);
		b.appendChild(muestra);
		return b;
	};

	for (var t = 0; t < paletaDefs.length; t++) {
		var grupo = paletaDefs[t];
		var boton = this.newAccordionButton(grupo.category);
		var acc = this.newAccordion(grupo.category);
		this.fillAccordion(acc, grupo.items);
		if (t === 0) {
			acc.classList.add("w3-show");
			acc.setAttribute("data-nsh-open", "1");
		}
		this.container.appendChild(boton);
		this.container.appendChild(acc);
	}
}
