exports.enviaRegistro = function(datos, callback) {
	var debug = false;
	if(debug)
		console.log("Enviando datos al servidor");
	var request = require('request');
	request.post({
		  url: 'http://aprende-ocst.sep.gob.mx/aula/v2/actionsV2.php',
		  form: datos
		}, function(error, response, body){
			if(debug) {
				console.log('error:', error);
				console.log('statusCode:', response && response.statusCode);
		  		console.log('body:', body);
			}
		if(response && response.statusCode==200) {
			callback(body);
		} else {
			console.log("Error de comunicación con el servidor");
		}
	});
}