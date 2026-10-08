var cuenta = (function () {
	var o = {};

	var app = null;
	var base = null;
	var yo = null;
	var listo = false;
	var esperan = [];
	var oyentes = [];
	var mando = null;

	function configurada() {
		return typeof firebase !== "undefined" && typeof NUBE_CONFIG !== "undefined" && !!NUBE_CONFIG.apiKey;
	}

	function arrancarFirebase() {
		if (app) { return true; }
		if (!configurada()) { return false; }
		try {
			app = firebase.initializeApp(NUBE_CONFIG, "nsharp");
			base = app.firestore();
			base.settings({ ignoreUndefinedProperties: true, merge: true });
		} catch (e) {
			console.error(e);
			app = null;
			base = null;
		}
		return !!app;
	}

	function correo() { return yo && yo.email ? yo.email.toLowerCase() : ""; }

	function nombre() { return yo ? (yo.displayName || correo() || "Alguien") : ""; }

	function inicial(txt) { return (txt || "?").trim().charAt(0).toUpperCase() || "?"; }

	function avatar(foto, txt, clase) {
		if (foto) {
			return '<img class="' + clase + '" src="' + util.escapar(foto) + '" alt="" referrerpolicy="no-referrer" />';
		}
		return '<span class="' + clase + ' nsh-avatar-letra">' + util.escapar(inicial(txt)) + "</span>";
	}

	function pintarBoton() {
		var b = document.getElementById("nshCuentaBtn");
		var m = document.getElementById("nshCuentaMenu");
		if (!b || !m) { return; }
		if (!yo) {
			b.innerHTML = '<i class="fa fa-google"></i> <span>Iniciar sesión</span>';
			b.title = "Iniciar sesión con Google para guardar tus proyectos en tu cuenta";
			b.classList.remove("nsh-pildora-cuenta");
			m.innerHTML = "";
			if (mando) { mando.cerrar(); }
			return;
		}
		b.innerHTML = avatar(yo.photoURL, nombre(), "nsh-avatar") +
			"<span>" + util.escapar(nombre().split(" ")[0]) + '</span> <i class="fa fa-caret-down"></i>';
		b.title = nombre() + " (" + correo() + ")";
		b.classList.add("nsh-pildora-cuenta");
		m.innerHTML = '<div class="nsh-cuenta-cabeza">' + avatar(yo.photoURL, nombre(), "nsh-avatar nsh-avatar-grande") +
			"<div><b>" + util.escapar(nombre()) + "</b><small>" + util.escapar(correo()) + "</small></div></div>" +
			'<div class="nsh-menu-sep"></div>' +
			'<button type="button" class="nsh-menu-item" data-nsh-cuenta="proyectos"><i class="fa fa-cloud"></i> Mis proyectos</button>' +
			'<button type="button" class="nsh-menu-item" data-nsh-cuenta="compartir"><i class="fa fa-user-plus"></i> Compartir este proyecto</button>' +
			'<button type="button" class="nsh-menu-item nsh-menu-peligro" data-nsh-cuenta="salir"><i class="fa fa-sign-out"></i> Cerrar sesión</button>';
	}

	function entrar() {
		if (!arrancarFirebase()) {
			util.aviso("El inicio de sesión todavía no está configurado", 3200);
			return Promise.reject(new Error("sin configurar"));
		}
		var prov = new firebase.auth.GoogleAuthProvider();
		prov.setCustomParameters({ prompt: "select_account" });
		return app.auth().signInWithPopup(prov).then(function (r) {
			util.aviso("Hola, " + (r.user.displayName || r.user.email || "").split(" ")[0]);
			return r.user;
		}).catch(function (e) {
			var codigo = e && e.code ? e.code : "";
			if (codigo !== "auth/popup-closed-by-user" && codigo !== "auth/cancelled-popup-request") {
				alert("No se pudo iniciar sesión.\n\nDetalle: " + (e && e.message ? e.message : e));
			}
			throw e;
		});
	}

	function salir() {
		if (!app || !yo) { return; }
		if (typeof nube !== "undefined" && nube.hayPendientes() &&
			!confirm("Todavía se están guardando cambios en la cuenta.\n¿Cerrar sesión igual?")) { return; }
		app.auth().signOut().then(function () { util.aviso("Se cerró la sesión"); });
	}

	function conSesion(fn) {
		if (yo) { fn(yo); return; }
		entrar().then(function (u) { if (u) { fn(u); } }).catch(function () { });
	}

	function cuando(fn) {
		if (listo) { fn(yo); } else { esperan.push(fn); }
	}

	function cerrarDialogo() {
		var v = document.getElementById("nshProyectos");
		if (v) { v.remove(); }
		document.removeEventListener("keydown", alEscape, true);
	}

	function alEscape(e) {
		if (e.key === "Escape") {
			e.stopPropagation();
			cerrarDialogo();
		}
	}

	function cuandoFue(ts) {
		if (!ts || !ts.toDate) { return ""; }
		var d = ts.toDate();
		var hoy = new Date();
		if (d.toDateString() === hoy.toDateString()) {
			return "hoy " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
		}
		return d.toLocaleDateString();
	}

	function filaProyecto(doc, rol) {
		var x = doc.data();
		var f = document.createElement("div");
		f.className = "nsh-proy-fila";
		var de = rol === "dueno" ? "" : " · de " + (x.duenoNombre || x.duenoCorreo || "otra persona");
		var cual = { dueno: "", editor: "Editor", lector: "Lector" }[rol];
		f.innerHTML = '<i class="fa ' + (rol === "lector" ? "fa-eye" : "fa-cloud") + ' nsh-proy-ico"></i>' +
			'<div class="nsh-proy-txt"><b>' + util.escapar(x.nombre || SIN_NOMBRE) + "</b>" +
			"<small>Editado " + util.escapar(cuandoFue(x.editado)) + util.escapar(de) + "</small></div>" +
			(cual ? '<span class="nsh-proy-rol">' + cual + "</span>" : "");
		f.title = "Abrir el proyecto";
		f.addEventListener("click", function () {
			cerrarDialogo();
			nube.abrir(doc.id);
		});
		if (rol === "dueno") {
			var b = document.createElement("button");
			b.type = "button";
			b.className = "nsh-proy-borrar";
			b.title = "Eliminar el proyecto de la cuenta";
			b.innerHTML = '<i class="fa fa-trash"></i>';
			b.addEventListener("click", function (e) {
				e.stopPropagation();
				if (!confirm('¿Eliminar "' + (x.nombre || SIN_NOMBRE) + '" de tu cuenta?\nTambién deja de estar disponible para las personas con las que lo compartiste.')) { return; }
				nube.borrar(doc.id).then(function () {
					f.remove();
					util.aviso("Se eliminó el proyecto");
				}).catch(function (err) {
					alert("No se pudo eliminar el proyecto.\n\nDetalle: " + (err && err.message ? err.message : err));
				});
			});
			f.appendChild(b);
		}
		return f;
	}

	function seccion(caja, titulo, docs, rolDe, vacio) {
		var h = document.createElement("h4");
		h.textContent = titulo;
		caja.appendChild(h);
		if (!docs.length) {
			var p = document.createElement("p");
			p.className = "nsh-proy-vacio";
			p.textContent = vacio;
			caja.appendChild(p);
			return;
		}
		docs.sort(function (a, b) {
			var x = a.data().editado, y = b.data().editado;
			return (y && y.toMillis ? y.toMillis() : 0) - (x && x.toMillis ? x.toMillis() : 0);
		}).forEach(function (d) { caja.appendChild(filaProyecto(d, rolDe(d))); });
	}

	function proyectos() {
		if (!configurada()) {
			util.aviso("El inicio de sesión todavía no está configurado", 3200);
			return;
		}
		conSesion(function () {
			cerrarDialogo();
			var v = document.createElement("div");
			v.id = "nshProyectos";
			v.className = "nsh-dialogo";
			v.innerHTML = '<div class="nsh-dialogo-card">' +
				'<h3><i class="fa fa-cloud"></i> Mis proyectos</h3>' +
				'<div class="nsh-proy-lista"><p class="nsh-proy-vacio"><i class="fa fa-spinner fa-spin"></i> Cargando…</p></div>' +
				'<div class="nsh-dialogo-pie"><button type="button" class="nsh-boton-sec" data-nsh-cerrar="1">Cerrar</button></div>' +
				"</div>";
			v.addEventListener("click", function (e) {
				if (e.target === v || e.target.getAttribute("data-nsh-cerrar")) { cerrarDialogo(); }
			});
			document.body.appendChild(v);
			document.addEventListener("keydown", alEscape, true);

			var col = base.collection("proyectos");
			Promise.all([
				col.where("dueno", "==", yo.uid).get(),
				col.where("editores", "array-contains", correo()).get(),
				col.where("lectores", "array-contains", correo()).get()
			]).then(function (r) {
				var caja = v.querySelector(".nsh-proy-lista");
				if (!caja) { return; }
				caja.innerHTML = "";
				seccion(caja, "Míos", r[0].docs, function () { return "dueno"; },
					"Todavía no tenés proyectos en la cuenta. Se guardan solos apenas empezás a editar.");
				var mios = r[0].docs.map(function (d) { return d.id; });
				var otros = r[1].docs.concat(r[2].docs).filter(function (d, i, todos) {
					return mios.indexOf(d.id) === -1 && todos.map(function (x) { return x.id; }).indexOf(d.id) === i;
				});
				var editables = r[1].docs.map(function (d) { return d.id; });
				seccion(caja, "Compartidos conmigo", otros, function (d) {
					return editables.indexOf(d.id) !== -1 ? "editor" : "lector";
				}, "Nadie compartió proyectos con vos todavía.");
			}).catch(function (e) {
				var caja = v.querySelector(".nsh-proy-lista");
				if (caja) {
					caja.innerHTML = '<p class="nsh-proy-vacio">No se pudieron cargar los proyectos.<br><small>' +
						util.escapar(e && e.message ? e.message : e) + "</small></p>";
				}
			});
		});
	}

	o.iniciar = function () {
		var b = document.getElementById("nshCuentaBtn");
		var m = document.getElementById("nshCuentaMenu");
		if (b) {
			b.addEventListener("click", function (e) {
				if (yo) { return; }
				e.preventDefault();
				e.stopImmediatePropagation();
				entrar().catch(function () { });
			});
		}
		mando = desplegable.armar(b, m, { hover: false, derecha: true });
		if (m) {
			m.addEventListener("click", function (e) {
				var x = e.target.closest("[data-nsh-cuenta]");
				if (!x) { return; }
				var que = x.getAttribute("data-nsh-cuenta");
				if (que === "proyectos") { proyectos(); }
				else if (que === "compartir") { compartir.abrir(); }
				else if (que === "salir") { salir(); }
			});
		}
		var p = document.getElementById("nshMisProyectosBtn");
		if (p) { p.addEventListener("click", proyectos); }

		pintarBoton();
		if (!arrancarFirebase()) {
			listo = true;
			esperan.splice(0).forEach(function (fn) { fn(null); });
			return;
		}
		app.auth().onAuthStateChanged(function (u) {
			yo = u;
			pintarBoton();
			var primera = !listo;
			listo = true;
			if (primera) { esperan.splice(0).forEach(function (fn) { fn(yo); }); }
			oyentes.forEach(function (fn) { fn(yo); });
		});
	};

	o.usuario = function () { return yo; };
	o.correo = correo;
	o.nombre = nombre;
	o.avatar = avatar;
	o.base = function () { return base; };
	o.configurada = configurada;
	o.entrar = entrar;
	o.salir = salir;
	o.conSesion = conSesion;
	o.cuando = cuando;
	o.alCambiar = function (fn) { oyentes.push(fn); };
	o.proyectos = proyectos;
	o.cerrarDialogo = cerrarDialogo;

	return o;
}());
