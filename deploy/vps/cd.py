"""Pull-based CD for the existing LittleBigCoders Compose project."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request

ROOT = Path('/opt/littlebigcoders')
STATE = ROOT / 'cd'
REPO = ROOT / 'source'
BRANCH = 'develop'
DATABASE = 'qf0bkfpgx2xihwqp62b65rpo'
HOST = 'plataforma.littlebigcoders.com.br'


def run(*args, **kwargs):
    return subprocess.run(list(args), check=True, **kwargs)


def output(*args):
    return subprocess.check_output(list(args), text=True).strip()


def compose(release):
    return ['docker', 'compose', '-p', 'littlebigcoders',
            '-f', str(release / 'deploy/vps/compose.yaml'),
            '-f', str(STATE / 'domain.override.json'),
            '-f', str(release / 'deploy/vps/images.override.json')]


def runtime(image, *command):
    run('docker', 'run', '--rm', '--network', 'coolify',
        '--env-file', str(ROOT / 'application.env'), image, *command)


def check_live(sha):
    expected = {'api': f'littlebigcoders-api:{sha}', 'web': f'littlebigcoders-web:{sha}'}
    for service, image in expected.items():
        actual = output('docker', 'inspect', '-f', '{{.Config.Image}}',
                        f'littlebigcoders-{service}-1')
        if actual != image:
            raise RuntimeError(f'Unexpected running image for {service}')
    with urllib.request.urlopen('http://127.0.0.1:18000/healthz', timeout=10) as response:
        if response.status != 200:
            raise RuntimeError('Frontend healthcheck failed')
    # Invalid credentials exercise the API's database query without modifying a user.
    probe = """import urllib.request, urllib.error
req=urllib.request.Request('http://littlebigcoders-api:8000/api/token/',
 data=b'{"login":"cd-healthcheck-nonexistent","password":"invalid"}',
 headers={'Content-Type':'application/json','Host':'plataforma.littlebigcoders.com.br','X-Forwarded-Proto':'https'})
try:
 urllib.request.urlopen(req,timeout=15)
 raise RuntimeError('Invalid credentials unexpectedly accepted')
except urllib.error.HTTPError as exc:
 assert exc.code == 401, exc.code
"""
    runtime(f'littlebigcoders-api:{sha}', 'python', '-c', probe)


def main():
    os.umask(0o077)
    STATE.mkdir(exist_ok=True)
    with (STATE / 'deploy.lock').open('w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        deploy()


def deploy():
    run('git', '-C', str(REPO), 'fetch', '--depth=1', 'origin', BRANCH,
        env={**os.environ, 'GIT_TERMINAL_PROMPT': '0'})
    sha = output('git', '-C', str(REPO), 'rev-parse', 'FETCH_HEAD')
    deployed = STATE / 'deployed.json'
    previous = json.loads(deployed.read_text()) if deployed.exists() else None
    if previous and previous['commit'] == sha:
        print(f'Already deployed {sha}', flush=True)
        return
    failed = STATE / 'failed.json'
    if failed.exists() and json.loads(failed.read_text())['commit'] == sha and '--retry' not in sys.argv:
        print(f'Commit {sha} previously failed; awaiting a new commit or --retry', flush=True)
        return
    print(f'Deploying {BRANCH}@{sha}', flush=True)
    release = ROOT / 'releases' / sha
    release.mkdir(parents=True, exist_ok=True)
    try:
        # Exclude legacy tracked virtualenvs, dependencies and data from release sources.
        paths = ['LittleBIGCodersPlataform/backend', 'LittleBIGCodersPlataform/frontend', 'deploy/vps']
        excludes = ['**/.venv/**', '**/.venv-win/**', '**/venv/**', '**/node_modules/**',
                    '**/__pycache__/**', '**/dist/**', '**/media/**', '**/staticfiles/**',
                    '**/*.sqlite3', '**/*.dump', '**/.env', '**/.env.*']
        with tempfile.TemporaryFile() as archive:
            run('git', '-C', str(REPO), 'archive', '--format=tar', sha, '--',
                *paths, *[f':(exclude){pattern}' for pattern in excludes], stdout=archive)
            archive.seek(0)
            with tarfile.open(fileobj=archive) as package:
                # The deployment host is Ubuntu 24.04 with Python's safe data filter.
                package.extractall(release, filter='data')
        for service, folder in [('api', 'backend'), ('web', 'frontend')]:
            run('docker', 'build', '--label', f'org.opencontainers.image.revision={sha}',
                '-t', f'littlebigcoders-{service}:{sha}',
                str(release / 'LittleBIGCodersPlataform' / folder))
        image = f'littlebigcoders-api:{sha}'
        runtime(image, 'python', 'manage.py', 'check', '--deploy', '--fail-level', 'ERROR')
        run('docker', 'run', '--rm', '-e', 'DJANGO_SETTINGS_MODULE=config.settings',
            image, 'python', 'manage.py', 'test', 'accounts.test_authentication', '--noinput')
        override = {'services': {name: {'image': f'littlebigcoders-{name}:{sha}'}
                                 for name in ('api', 'web')}}
        (release / 'deploy/vps/images.override.json').write_text(json.dumps(override))
        command = compose(release)
        run(*command, 'config', '--quiet')
        backup = ROOT / 'migration/backups' / f'pre-deploy-{time.time_ns()}-{sha[:12]}.dump'
        with backup.open('wb') as stream:
            run('docker', 'exec', DATABASE, 'pg_dump', '-U', 'postgres', '-d',
                'littlebigcoders', '--format=custom', '--no-owner', '--no-acl', stdout=stream)
        if backup.stat().st_size < 1000:
            raise RuntimeError('Pre-deploy database backup is unexpectedly small')
        with backup.open('rb') as stream:
            run('docker', 'exec', '-i', DATABASE, 'pg_restore', '--list',
                stdin=stream, stdout=subprocess.DEVNULL)
        backup.with_suffix('.dump.sha256').write_text(
            hashlib.sha256(backup.read_bytes()).hexdigest() + '  ' + backup.name + '\n')
        runtime(image, 'python', 'manage.py', 'migrate', '--noinput')
        try:
            run(*command, 'up', '-d', '--no-build')
            for attempt in range(12):
                try:
                    check_live(sha)
                    break
                except Exception:
                    if attempt == 11:
                        raise
                    time.sleep(5)
        except Exception:
            if previous:
                run(*previous['compose'], 'up', '-d', '--no-build')
                print('Previous application images restored; database was not rolled back.', flush=True)
            raise
        record = {'commit': sha, 'branch': BRANCH, 'compose': command,
                  'backup': str(backup), 'deployed_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
        temporary = STATE / 'deployed.next.json'
        temporary.write_text(json.dumps(record, indent=2))
        temporary.replace(deployed)
        if failed.exists():
            failed.unlink()
        print(f'DEPLOY_OK {sha}', flush=True)
    except Exception as exc:
        failed.write_text(json.dumps({'commit': sha, 'error': str(exc)}))
        raise


if __name__ == '__main__':
    main()
