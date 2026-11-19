#!/bin/sh
set -eu

# Wrapped in a function so the shell has read the whole file before git pull replaces it.
main() {
	cd /opt/aleax
	sudo -u aleax git pull --ff-only
	sudo -u aleax npm ci
	sudo -u aleax npm run build
	cp deploy/aleax.service deploy/aleax-cleanup.service deploy/aleax-cleanup.timer /etc/systemd/system/
	systemctl daemon-reload
	systemctl enable --now aleax-cleanup.timer
	systemctl restart aleax
	systemctl is-active aleax
}

main
