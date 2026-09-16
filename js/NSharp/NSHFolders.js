var clases = (function () {
	var o = {};
	var V = 1;

	var lista = [];
	var donde = {};

	function reset() { lista = []; donde = {}; }

	function todas() { return lista.slice(); }

	function porId(id) {
		for (var i = 0; i < lista.length; i++) { if (lista[i].id === id) { return lista[i]; } }
		return null;
	}

	function hijas(padre) {
		return lista.filter(function (c) { return (c.parent || null) === (padre || null); });
	}

	function nueva(nombre, padre) {
		var c = { id: util.nuevoId("f"), name: nombre || "LaClase", parent: padre || null, open: true };
		lista.push(c);
		return c;
	}

	function renombrar(id, nombre) {
		var c = porId(id);
		if (c && nombre) { c.name = nombre; }
		return c;
	}

	function abrir(id, si) {
		var c = porId(id);
		if (c) { c.open = !!si; }
	}

	function tocar(id) {
		var c = porId(id);
		if (c) { c.open = !c.open; }
	}

	function esDescendiente(id, posibleAbuelo) {
		var c = porId(id);
		while (c) {
			if (c.id === posibleAbuelo) { return true; }
			c = c.parent ? porId(c.parent) : null;
		}
		return false;
	}

	function ponerPadre(id, padre) {
		if (id === padre || (padre && esDescendiente(padre, id))) { return false; }
		var c = porId(id);
		if (!c) { return false; }
		c.parent = padre || null;
		return true;
	}

	function ubicar(id, padre, antesDe) {
		if (!ponerPadre(id, padre || null)) { return false; }
		var c = porId(id);
		lista.splice(lista.indexOf(c), 1);
		var pos = lista.length;
		if (antesDe) {
			var i = lista.indexOf(porId(antesDe));
			if (i !== -1) { pos = i; }
		}
		lista.splice(pos, 0, c);
		return true;
	}

	function eliminar(id) {
		var c = porId(id);
		if (!c) { return; }
		var padre = c.parent || null;
		lista.forEach(function (h) { if (h.parent === id) { h.parent = padre; } });
		Object.keys(donde).forEach(function (m) { if (donde[m] === id) { donde[m] = padre; } });
		lista = lista.filter(function (x) { return x.id !== id; });
	}

	function claseDeMetodo(metId) {
		var id = donde[metId] || null;
		return (id && porId(id)) ? id : null;
	}

	function asignarA(metId, carpetaId) {
		if (carpetaId) { donde[metId] = carpetaId; } else { delete donde[metId]; }
	}

	function olvidar(metId) { delete donde[metId]; }

	function paraGuardar(mets) {
		if (!lista.length) { return null; }
		return {
			v: V,
			folders: lista.map(function (c) {
				return { id: c.id, name: c.name, parent: c.parent, open: c.open };
			}),
			map: mets.map(function (m) { return claseDeMetodo(m.id); })
		};
	}

	function desdeArchivo(data, mets) {
		reset();
		if (!data || !(data.folders instanceof Array)) { return; }
		lista = data.folders.map(function (c) {
			return {
				id: c.id,
				name: c.name || "Clase",
				parent: c.parent || null,
				open: c.open !== false
			};
		});
		var m = data.map instanceof Array ? data.map : [];
		mets.forEach(function (d, i) {
			var cid = m[i] || null;
			if (cid && porId(cid)) { donde[d.id] = cid; }
		});
	}

	o.reset = reset;
	o.todas = todas;
	o.porId = porId;
	o.hijas = hijas;
	o.nueva = nueva;
	o.renombrar = renombrar;
	o.abrir = abrir;
	o.tocar = tocar;
	o.esDescendiente = esDescendiente;
	o.ponerPadre = ponerPadre;
	o.ubicar = ubicar;
	o.eliminar = eliminar;
	o.claseDeMetodo = claseDeMetodo;
	o.asignarA = asignarA;
	o.olvidar = olvidar;
	o.paraGuardar = paraGuardar;
	o.desdeArchivo = desdeArchivo;

	return o;
}());
