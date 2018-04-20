#!/usr/bin/env node

require('crontab').load(function(err, crontab) {
	var jobs = crontab.jobs({command:'aulaaprende'});
	if(jobs.length>0) {
		crontab.remove({command:'aulaaprende'});
	}
	crontab.save(function(err, crontab) {
	});
});