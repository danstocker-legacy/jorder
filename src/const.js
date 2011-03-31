////////////////////////////////////////////////////////////////////////////////
// jOrder constants
////////////////////////////////////////////////////////////////////////////////
var jOrder = function (jOrder) {
	// version
	jOrder.version = '1.1.0.14';
	jOrder.name = "jOrder";
	
	// sorting directions
	jOrder.asc = 1;
	jOrder.desc = -1;
	
	// index types
	jOrder.string = 0;
	jOrder.number = 1;
	jOrder.text = 2;
	jOrder.array = 3;
	
	// range params
	jOrder.start = 0;
	jOrder.end = 1;
	
	// search modes
	jOrder.exact = 0;
	jOrder.range = 1;
	jOrder.startof = 2;
	
	return jOrder;
}(jOrder || {});

