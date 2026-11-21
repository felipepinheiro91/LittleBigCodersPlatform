"""Download the permitted VPS archive through a restricted SSH key."""
import argparse
import hashlib
from pathlib import Path
import subprocess
from datetime import datetime, timezone


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--key', type=Path, required=True)
    parser.add_argument('--known-hosts', type=Path, required=True)
    parser.add_argument('--destination', type=Path, required=True)
    args = parser.parse_args()
    ssh = ['ssh', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes',
           '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=15',
           '-o', f'UserKnownHostsFile={args.known_hosts.resolve()}',
           '-i', str(args.key.resolve()), 'root@179.66.156.112']
    expected = subprocess.check_output(ssh + ['backup-sha256'], text=True).split()[0]
    if len(expected) != 64 or any(c not in '0123456789abcdef' for c in expected):
        raise RuntimeError('Invalid remote checksum')
    args.destination.mkdir(parents=True, exist_ok=True, mode=0o700)
    filename = 'littlebigcoders-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '.dump'
    target = args.destination / filename
    partial = target.with_suffix('.dump.partial')
    with partial.open('xb') as output:
        subprocess.run(ssh + ['backup'], stdout=output, check=True)
    with partial.open('rb') as source:
        actual = hashlib.file_digest(source, 'sha256').hexdigest()
    if actual != expected:
        raise RuntimeError('Backup checksum mismatch; partial file retained for inspection')
    partial.rename(target)
    target.with_suffix('.dump.sha256').write_text(f'{actual}  {filename}\n', encoding='ascii')
    print(f'BACKUP_VERIFIED {target} ({target.stat().st_size} bytes)')


if __name__ == '__main__':
    main()
