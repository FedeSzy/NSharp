nro = 0;
function Metodo(theClass, name, code) {
	this.setData = function (theClass, name, code) {
		this.theClass = theClass;
		this.name = name;
		this.code = code;
	}
	nro++;
	this.id = "NSPDiagram-" + nro;
	this.setData(theClass, name, code);
}
