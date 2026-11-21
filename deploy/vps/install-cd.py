"""Install/update the CD supervisor without replacing application secrets."""
import json
import os
from pathlib import Path
import shutil
import subprocess


def main():
    if os.geteuid() != 0:
        raise SystemExit('Run as root on the deployment VPS')
    os.umask(0o077)
    root = Path('/opt/littlebigcoders')
    folder = Path(__file__).resolve().parent
    state = root / 'cd'
    state.mkdir(mode=0o700, exist_ok=True)
    domain_config = root / 'source/deploy/vps/domain.override.json'
    if not (root / 'application.env').is_file() or not domain_config.is_file():
        raise SystemExit('Existing production configuration is required')
    for name in ('cd.py', 'littlebigcoders-cd.service', 'littlebigcoders-cd.timer'):
        destination = state / name if name == 'cd.py' else Path('/etc/systemd/system') / name
        shutil.copyfile(folder / name, destination)
        destination.chmod(0o600 if name == 'cd.py' else 0o644)
    # Keep the running deployment's labels when upgrading an existing supervisor.
    if not (state / 'domain.override.json').exists():
        shutil.copyfile(domain_config, state / 'domain.override.json')
    if not (state / 'deployed.json').exists():
        initial = {'commit': 'manual-bootstrap', 'branch': 'develop',
                   'compose': ['docker', 'compose', '-p', 'littlebigcoders',
                               '-f', str(root / 'source/deploy/vps/compose.yaml'),
                               '-f', str(state / 'domain.override.json')]}
        (state / 'deployed.json').write_text(json.dumps(initial, indent=2))
    subprocess.run(['systemctl', 'daemon-reload'], check=True)
    subprocess.run(['systemctl', 'enable', '--now', 'littlebigcoders-cd.timer'], check=True)
    print('CD installed; inspect journalctl -u littlebigcoders-cd.service')


if __name__ == '__main__':
    main()
