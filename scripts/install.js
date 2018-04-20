#!/usr/bin/env node
require('crontab').load(function(err, crontab) {
	var jobs = crontab.jobs({command:'aulaaprende'});
	if(jobs.length>0) {
		crontab.remove({command:'aulaaprende'});
	}
	var job = crontab.create("/usr/bin/aulaaprende 2>&1 >"+config_dir + "logs/aula.log", '*/1 * * * *', 'Aula @prende 2.0');
	crontab.save(function(err, crontab) {
	});
	checkUser();
});