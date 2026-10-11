#!/bin/sh
set -eu

# Wrapped in a function so the shell has read the whole file before git pull replaces it.
main() {
	cd /opt/alea
	sudo -u alea git pull --ff-only
	sudo -u alea npm ci
	sudo -u alea npm run build
	cp deploy/alea.service deploy/alea-cleanup.service deploy/alea-cleanup.timer /etc/systemd/system/
	systemctl daemon-reload
	systemctl enable --now alea-cleanup.timer
	systemctl restart alea
	systemctl is-active alea
}

main
