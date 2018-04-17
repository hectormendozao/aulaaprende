#!/usr/bin/env nodejs
console.log("Iniciando ejecución");
var config_dir = '/tmp/temp/var/lib/aula@prende/';
var configCCT = "/tmp/temp/usr/lib/ttyc/a10c5675cab628c1ab82b7ee37e71cd9";
var archivoMAC = '/tmp/temp/usr/lib/ttyc/a1416735702a7d53b1ce91245c2e5720';
var lock_file = '.update.lock';
var config_file = 'config';
var chk = {
		plataforma: false,
		tz: false,
		system: false,
		cpuCurrentSpeed: false,
		networkInterfaces: false,
		fsSize: false,
		osInfo: false,
		mem: false,
		baseboard: false,
		bios: false,
		blockDevices: false,
		cpu: false,
		battery: false,
		versions: false,
	// diskLayout: false
	};
var data = {};
var uidaula = null;
var gidaula = null;
var mysqlv;
var phpv;
var apache2v;


function optionalArguments(a="nothing", b="nothing") {
	  return 'a: ${a}, b: ${b}';
}

function escribeMAC() {
	var fs = require('fs')
	var mac = fs.createWriteStream(archivoMAC, {
	  flags: 'w'
	});
	data.networkInterfaces.forEach(function(item, key) {
		if(item.mac!='') {
			mac.write(item.mac+"\n");
		}
	});
	mac.end();
	var fs = require('fs');
	fs.chownSync(archivoMAC, uidaula, gidaula);
	revisaConfiguracion();
}

function revisaConfiguracion() {
	console.log("Revisando configuración");
	const execSync = require('child_process').execSync;
	mysqlv = execSync('mysql --version').toString('utf8');
	phpv = execSync('php -v').toString('utf8');
	apache2v = execSync('apache2 -v').toString('utf8');
	var fs = require('fs');
	var hypsoft = require('./lib/hypsoft.js');
    if(fs.existsSync(configCCT)) {
    	console.log("Existe CCT");
    	var mac = [];
    	data.networkInterfaces.forEach(function(item, key) {
    		if(item.mac!='') {
    			mac.push({iface: item.iface, mac: item.mac})
    		}
    	});
    	console.log(mac);
    	var cct = fs.readFileSync(configCCT).toString('UTF-8').trim();
    	console.log(cct);
    	hypsoft.enviaRegistro({
			  action: 'registerCCT',
	          cct: cct,
	          mac: mac,
	          aulav: require('./package.json').version,
	          php: phpv,
	          mysql: mysqlv,
	          apache: apache2v,
	          srvinfo: data
		  }, function(respuesta) {
			  console.log(respuesta);
			  var data = JSON.parse(respuesta);
			  console.log(data);
		  });
    }
    // TODO Configuración
}

function datos(fn, datos) {
	chk[fn] = true;
	data[fn] = datos;
	if(Object.keys(chk).every(function(k){ return chk[k] === true })) {
		console.log("Listo para enviar datos");
		escribeMAC();
	}
}

function crearDirectorio(directorio, permisos = 0755, uid = uidaula, gid=gidaula){
    console.log("Revisando directorio "+directorio);
    var fs = require('fs');
    if(fs.existsSync(directorio)) {
    	info = fs.statSync(directorio);
    	if(info.isDirectory()) {
    		if(info.uid == uid && info.gid == gid) {
    		} else {
    			fs.chownSync(directorio, uid, gid);
    		}
    		fs.chmodSync(directorio, permisos);
    	}
    } else {
        console.log("Creando directorio "+directorio);
    	fs.mkdirSync(directorio, permisos);
    	fs.chownSync(directorio, uid, gid);
    }
}

function checkGroup() {
	console.log("Revisando grupo aula");
	var linuxUser = require('linux-sys-user');
	linuxUser.getGroupInfo('aula', function(err, group) {
		gidaula = group.gid;
		if(group==null) {
			linuxUser.addGroup('aula', function (err, group) {
				creaDirectorios();
			});
		} else {
			creaDirectorios();
		}
	});
}

function checkUser() {
	console.log("Revisando usuario aula");
	var linuxUser = require('linux-sys-user');
	linuxUser.getUserInfo('aula', function (err, user) {
		uidaula = user.uid;
		if(user==null) {
			linuxUser.addUser('aula', function (err, user) {
				checkGroup();
			});
		} else {
			checkGroup();
		}
	});
}

function creaDirectorios() {
	console.log("Creando directorios");
	crearDirectorio(config_dir);
	crearDirectorio(config_dir + "logs");
	crearDirectorio(config_dir + "archivos");
	crearDirectorio(config_dir + "tmp", 0777);
	crearDirectorio("/tmp/temp/usr/lib/ttyc/");
	yaEjecutando();
}

function recopilaDatos() {
	datos('plataforma', {plataforma: process.platform});
	const si = require('systeminformation');
	datos("tz", {tz: si.time().timezone, tzName: si.time().timezoneName});
	si.system(function(data) {
		datos("system", data);
	});
	si.bios(function(data) {
		datos("bios", data);
	});
	si.baseboard(function(data) {
		datos("baseboard", data);
	});
	si.cpu(function(data) {
		datos("cpu", data);
	});
	si.cpuCurrentspeed(function(data) {
		datos("cpuCurrentSpeed", data);
	});
	si.mem(function(data) {
		datos("mem", {total: data.total, free: data.free, used: data.used, active:data.active, available: data.available});
	});
	// si.diskLayout(function(data) {
	// datos("diskLayout", data);
	// });
	si.battery(function(data) {
		datos("battery", data);
	});
	si.osInfo(function(data) {
		datos("osInfo", data);
	});
	si.versions(function(data) {
		datos("versions", data);
	});
	si.fsSize(function(data) {
		datos("fsSize", data);
	});
	si.blockDevices(function(data) {
		datos("blockDevices", data);
	});
	si.networkInterfaces(function(data) {
		datos("networkInterfaces", data);
	});
}

function yaEjecutando() {
	var fs = require('fs');
	var lockfile = config_dir + lock_file;
    if(fs.existsSync(lockfile)) {
    	console.log("Ya estamos ejecutando");
    	process.exit(2);
    } else {
    	fs.writeFileSync(lockfile,"1");
    	recopilaDatos();
    }
}

function exitHandler() {
	var fs = require('fs');
	var lockfile = config_dir + lock_file;
	if(fs.existsSync(lockfile)) {
		fs.unlinkSync(lockfile);
	}
	console.log("Finalizando ejecución");
}


// do something when app is closing
process.on('exit', exitHandler.bind());

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind());

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind());
process.on('SIGUSR2', exitHandler.bind());

// catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind());

// revisar si ejecutamos como root y verificar el usuario
if(require("os").userInfo().username=="root") {
	console.log("Ejecutando como root");
	checkUser();
} else {
	console.log("Error ejecutando como "+require("os").userInfo().username+" debe ejecutar como root");
	process.exit(1);
}
