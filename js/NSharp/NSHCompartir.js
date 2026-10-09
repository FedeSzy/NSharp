var compartir = (function () {
	var o = {};

	var ENLACES = [
		{ id: "nadie", label: "Solo las personas agregadas" },
		{ id: "lector", label: "Cualquiera de ORT con el link puede ver" },
		{ id: "editor", label: "Cualquiera de ORT con el link puede editar" }
	];

	var viendo = null;

	function caja() { return document.getElementById("nshCompartir"); }

	function correoValido(c) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c); }

	function cerrar() {
		var v = caja();
		if (v) { v.remove(); }
		viendo = null;
		document.removeEventListener("keydown", alEscape, true);
	}

	function alEscape(e) {
		if (e.key === "Escape") {
			e.stopPropagation();
			cerrar();
		}
	}

	function datos(e) { return (e && e.nube && e.nube.datos) || {}; }

	function guardar(e, cambios, aviso) {
		return nube.cambiarAcceso(e, cambios).then(function () {
			if (aviso) { util.aviso(aviso); }
		}).catch(function (err) {
			alert("No se pudo cambiar el acceso.\n\nDetalle: " + (err && err.message ? err.message : err));
		});
	}

	function quitarDe(lista, c) { return (lista || []).filter(function (x) { return x !== c; }); }

	function ponerRol(e, c, rol) {
		var x = datos(e);
		var ed = quitarDe(x.editores, c);
		var le = quitarDe(x.lectores, c);
		if (rol === "editor") { ed.push(c); }
		if (rol === "lector") { le.push(c); }
		return guardar(e, { editores: ed, lectores: le });
	}

	function agregar(e) {
		var v = caja();
		var i = v.querySelector(".nsh-comp-correo");
		var r = v.querySelector(".nsh-comp-rol");
		var c = (i.value || "").trim().toLowerCase().replace(/\./g, function (p, pos, todo) {
			return todo.indexOf("@") === -1 ? "" : p;
		});
		if (/^\d{6,9}$/.test(c)) { c = c + "@est.ort.edu.ar"; }
		if (!correoValido(c)) {
			util.aviso("Escribí el DNI del alumno o un correo de ORT");
			i.focus();
			return;
		}
		if (!cuenta.permitido(c)) {
			util.aviso("Solo se puede compartir con cuentas de ORT (@ort.edu.ar o @est.ort.edu.ar)", 3600);
			i.focus();
			return;
		}
		if (c === (datos(e).duenoCorreo || "").toLowerCase()) {
			util.aviso("Esa persona ya es la dueña del proyecto");
			return;
		}
		i.value = "";
		ponerRol(e, c, r.value).then(function () {
			util.aviso("Se agregó a " + c + ". Mandale el link para que lo abra.", 3200);
		});
	}

	function filaPersona(e, c, rol, soyDueno) {
		var f = document.createElement("div");
		f.className = "nsh-comp-fila";
		var txt = document.createElement("span");
		txt.className = "nsh-comp-quien";
		txt.textContent = c;
		f.appendChild(txt);
		if (rol === "dueno" || !soyDueno) {
			var t = document.createElement("span");
			t.className = "nsh-comp-tipo";
			t.textContent = { dueno: "Dueño", editor: "Editor", lector: "Lector" }[rol];
			f.appendChild(t);
			return f;
		}
		var s = document.createElement("select");
		s.innerHTML = '<option value="editor">Editor</option><option value="lector">Lector</option>';
		s.value = rol;
		s.addEventListener("change", function () { ponerRol(e, c, s.value); });
		f.appendChild(s);
		var x = document.createElement("button");
		x.type = "button";
		x.className = "nsh-comp-quitar";
		x.title = "Quitar el acceso";
		x.innerHTML = '<i class="fa fa-times"></i>';
		x.addEventListener("click", function () { ponerRol(e, c, null); });
		f.appendChild(x);
		return f;
	}

	function pintar(e) {
		var v = caja();
		if (!v || !e || !e.nube) { return; }
		var x = datos(e);
		var soyDueno = nube.rolDe(e) === "dueno";

		v.querySelector(".nsh-comp-nombre").textContent = solapas.nombre(e);
		v.querySelector(".nsh-comp-agregar").classList.toggle("invisible", !soyDueno);
		v.querySelector(".nsh-comp-aviso").classList.toggle("invisible", soyDueno);

		var gente = v.querySelector(".nsh-comp-gente");
		gente.innerHTML = "";
		gente.appendChild(filaPersona(e, x.duenoCorreo || x.duenoNombre || "", "dueno", soyDueno));
		(x.editores || []).forEach(function (c) { gente.appendChild(filaPersona(e, c, "editor", soyDueno)); });
		(x.lectores || []).forEach(function (c) { gente.appendChild(filaPersona(e, c, "lector", soyDueno)); });

		var en = v.querySelector(".nsh-comp-enlace");
		en.value = x.enlace || "nadie";
		en.disabled = !soyDueno;
		v.querySelector(".nsh-comp-link").value = nube.link(e);
	}

	function mostrar(e) {
		cerrar();
		viendo = e;
		var v = document.createElement("div");
		v.id = "nshCompartir";
		v.className = "nsh-dialogo";
		v.innerHTML = '<div class="nsh-dialogo-card">' +
			'<h3><i class="fa fa-user-plus"></i> Compartir «<span class="nsh-comp-nombre"></span>»</h3>' +
			'<div class="nsh-comp-agregar">' +
			'<input type="text" class="nsh-comp-correo" placeholder="DNI del alumno o correo de ORT" autocomplete="off" />' +
			'<select class="nsh-comp-rol"><option value="editor">Editor</option><option value="lector">Lector</option></select>' +
			'<button type="button" class="nsh-boton nsh-comp-sumar">Agregar</button>' +
			"</div>" +
			'<p class="nsh-comp-aviso invisible">Solo la persona dueña del proyecto puede cambiar quién tiene acceso.</p>' +
			"<h4>Personas con acceso</h4>" +
			'<div class="nsh-comp-gente"></div>' +
			"<h4>Acceso con el link</h4>" +
			'<select class="nsh-comp-enlace">' + ENLACES.map(function (x) {
				return '<option value="' + x.id + '">' + x.label + "</option>";
			}).join("") + "</select>" +
			'<div class="nsh-comp-linkfila">' +
			'<input type="text" class="nsh-comp-link" readonly />' +
			'<button type="button" class="nsh-boton nsh-comp-copiar"><i class="fa fa-link"></i> Copiar link</button>' +
			"</div>" +
			'<p class="nsh-comp-nota">Si escribís solo el DNI se completa como <b>DNI@est.ort.edu.ar</b>. ' +
			"Las personas agregadas tienen que iniciar sesión con esa cuenta de ORT; mandales el link para que abran el proyecto.</p>" +
			'<div class="nsh-dialogo-pie"><button type="button" class="nsh-boton-sec" data-nsh-cerrar="1">Listo</button></div>' +
			"</div>";

		v.addEventListener("click", function (ev) {
			if (ev.target === v || ev.target.getAttribute("data-nsh-cerrar")) { cerrar(); }
		});
		v.querySelector(".nsh-comp-sumar").addEventListener("click", function () { agregar(e); });
		v.querySelector(".nsh-comp-correo").addEventListener("keydown", function (ev) {
			ev.stopPropagation();
			if (ev.key === "Enter") { agregar(e); }
		});
		v.querySelector(".nsh-comp-enlace").addEventListener("change", function (ev) {
			guardar(e, { enlace: ev.target.value }, "Se cambió el acceso con el link");
		});
		v.querySelector(".nsh-comp-copiar").addEventListener("click", function () {
			var t = v.querySelector(".nsh-comp-link");
			var listo = function () { util.aviso("Se copió el link"); };
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(t.value).then(listo).catch(function () {
					t.select();
					document.execCommand("copy");
					listo();
				});
			} else {
				t.select();
				document.execCommand("copy");
				listo();
			}
		});

		document.body.appendChild(v);
		document.addEventListener("keydown", alEscape, true);
		pintar(e);
		if (nube.rolDe(e) === "dueno") { v.querySelector(".nsh-comp-correo").focus(); }
	}

	function abrir() {
		var e = solapas.actual();
		if (!e) { return; }
		if (!cuenta.configurada()) {
			util.aviso("El inicio de sesión todavía no está configurado", 3200);
			return;
		}
		cuenta.conSesion(function () {
			if (e.nube) {
				mostrar(e);
				return;
			}
			nube.subirNuevo(e).then(function (id) { if (id) { mostrar(e); } });
		});
	}

	o.iniciar = function () {
		var b = document.getElementById("nshCompartirBtn");
		if (b) { b.addEventListener("click", abrir); }
	};
	o.abrir = abrir;
	o.cerrar = cerrar;
	o.alCambiar = function (e) { if (viendo === e) { pintar(e); } };

	return o;
}());
