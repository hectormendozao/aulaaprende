#!/bin/bash
crontab -l | grep -v "aulaaprende" > /tmp/cronjob.aula
crontab -u root /tmp/cronjob.aula