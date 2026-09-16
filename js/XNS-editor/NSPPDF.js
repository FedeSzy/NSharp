function Pdf() {
	this.container = document.getElementById("projectPrint");
	this.title = document.getElementById("PDFTitle");
	this.subTitle = document.getElementById("PDFSubTitle");
	this.autor = document.getElementById("PDFAutor");
	this.comission = document.getElementById("PDFComission");
	this.date = document.getElementById("PDFDate");
	this.minutes = document.getElementById("PDFMinutes");
	this.printDiagrams = document.getElementById("projectPrintDiagrams");

	this.setProject = function (p, simple) {
		ponerClase(simple, "invisible", this.subTitle);
		this.printDiagrams.innerHTML = "";
		this.title.innerHTML = p.name;
		this.autor.innerHTML = '<a class="metaAutor" href=file:///' + this.autores(p) + ' target="_blank">' + p.getInfo("usr") + '</a>';
		this.comission.innerHTML = p.getInfo("com");
		this.date.innerHTML = p.getDateStr();
		this.minutes.innerHTML = p.resolutionTime + " minutos";
		var marca = this.marcaAgua();
		p.publishTo(d => {
			var caja = document.createElement("div");
			if (!simple) {
				caja.appendChild(this.nuevaMarca(marca));
			}
			caja.innerHTML += d.code;
			caja.classList.add("Nassi-Shneiderman");
			this.printDiagrams.appendChild(caja);
		});
		this.taparIconos();
	}

	this.autores = function (p) {
		var txt = "ÚNICO_AUTOR";
		if (p.meta) {
			txt = "";
			var data = p.getLog();
			for (var i = 0; i < data.length; i++) {
				txt += ((data[i]["i"]) ? (data[i]["i"].autor || data[i]["i"].usr) : "ANONIMO") + "/"
			}
		}
		return txt.split(" ").join("_");
	}

	this.taparIconos = function () {
		var flechas = document.querySelectorAll("#projectPrint .fa-arrows");
		for (let a = 0; a < flechas.length; a++) {
			ponerClase(true, "invisible", flechas[a].parentNode);
		}
		var switches = document.querySelectorAll("#projectPrint .switch-button");
		for (let a = 0; a < switches.length; a++) {
			ponerClase(true, "invisible", switches[a]);
		}
	}

	this.nuevaMarca = function (txt) {
		var p = document.createElement("p");
		p.innerHTML = txt;
		p.classList.add("watermark", "w3-large", "w3-center");
		return p;
	}

	this.marcaAgua = function () {
		return this.autor.innerHTML + "<br/>" + this.comission.innerHTML + "<br/>" + this.date.innerHTML;
	}
}
