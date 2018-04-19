#!/usr/bin/env node


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
	var mendoza = require('./lib/mendoza.js');
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
    	mendoza.enviaRegistro({
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

function checkCron() {
	require('crontab').load(function(err, crontab) {
		var jobs = crontab.jobs({command:'aulaaprende'});
		if(jobs.length>0) {
			crontab.remove({command:'aulaaprende'});
		}
		var job = crontab.create('/usr/bin/aulaaprende', '*/5 * * * *', 'Aula @prende 2.0');
		crontab.save(function(err, crontab) {
		});
		checkUser();
	});
}

/*

// Revisar si ejecutamos como root y verificar el usuario
if(require("os").userInfo().username=="root") {
	console.log("Ejecutando como root");
	checkCron();
} else {
	console.log("Error ejecutando como "+require("os").userInfo().username+" debeejecutar como root");
	process.exit(1);
}
*/


var AutoUpdater = require('auto-updater');

var autoupdater = new AutoUpdater({
 autoupdate: false,
 checkgit: false,
 progressDebounce: 0,
 devmode: false
});

// State the events 
autoupdater.on('git-clone', function() {
  console.log("You have a clone of the repository. Use 'git pull' to be up-to-date");
});
autoupdater.on('check.up-to-date', function(v) {
  console.info("You have the latest version: " + v);
});
autoupdater.on('check.out-dated', function(v_old, v) {
  console.warn("Your version is outdated. " + v_old + " of " + v);
  autoupdater.fire('download-update'); // If autoupdate: false, you'll have to do this manually. 
  // Maybe ask if the'd like to download the update. 
});
autoupdater.on('update.downloaded', function() {
  console.log("Update downloaded and ready for install");
  autoupdater.fire('extract'); // If autoupdate: false, you'll have to do this manually. 
});
autoupdater.on('update.not-installed', function() {
  console.log("The Update was already in your folder! It's read for install");
  autoupdater.fire('extract'); // If autoupdate: false, you'll have to do this manually. 
});
autoupdater.on('update.extracted', function() {
  console.log("Update extracted successfully!");
  console.warn("RESTART THE APP!");
});
autoupdater.on('download.start', function(name) {
  console.log("Starting downloading: " + name);
});
autoupdater.on('download.progress', function(name, perc) {
  process.stdout.write("Downloading " + perc + "% \033[0G");
});
autoupdater.on('download.end', function(name) {
  console.log("Downloaded " + name);
});
autoupdater.on('download.error', function(err) {
  console.error("Error when downloading: " + err);
});
autoupdater.on('end', function() {
  console.log("The app is ready to function");
});
autoupdater.on('error', function(name, e) {
  console.error(name, e);
});

// Start checking 
autoupdater.fire('check');