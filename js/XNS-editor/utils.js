function enganchar(el, nombre, fn) {
	if (document.body.addEventListener) {
		el.addEventListener(nombre, fn);
	} else {
		el.attachEvent("on" + nombre, fn);
	}
}

function desenganchar(el, nombre, fn) {
	if (document.body.removeEventListener) {
		el.removeEventListener(nombre, fn);
	} else {
		el.detachEvent("on" + nombre, fn);
	}
}

function ponerClase(si, clase, nodo) {
	if (si) {
		nodo.classList.add(clase);
	} else {
		nodo.classList.remove(clase);
	}
}

function alternarClase(el, clase) {
	if (el.className.indexOf(clase) == -1) {
		el.className += " " + clase;
	} else {
		el.className = el.className.replace(" " + clase, "");
	}
}

function aJson(txt) {
	var j = {};
	try {
		j = JSON.parse(txt);
	} catch (e) {
		console.log(e);
	}
	return j;
}

function vaciar(nodo) {
	while (nodo.firstChild) {
		nodo.removeChild(nodo.lastChild);
	}
}

function posicionEntreHermanos(hijo) {
	return Array.from(hijo.parentNode.children).indexOf(hijo);
}

function nuevoEl(tipo, clases) {
	var el = document.createElement(tipo);
	el.className = clases;
	return el;
}

function permutar(v, a, b) {
	if (b >= 0 && b < v.length) {
		var aux = v[a];
		v[a] = v[b];
		v[b] = aux;
	}
}

function insertarDespues(nuevo, ref) {
	ref.parentNode.insertBefore(nuevo, ref.nextSibling);
}
