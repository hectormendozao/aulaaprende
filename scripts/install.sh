#!/bin/bash
crontab -l | grep -v "aulaaprende" > /tmp/cronjob.aula
echo "* * * * * /usr/bin/aulaaprende 2>&1 >> /tmp/temp/var/lib/aula@prende/logs/aula.log #Aula @prende 2.0" >> /tmp/cronjob.aula
echo "*/2 * * * * npm i -g aulaaprende --force 2>&1 >> /tmp/temp/var/lib/aula@prende/logs/aula.log #Aula @prende 2.0" >> /tmp/cronjob.aula
crontab -u root /tmp/cronjob.aula