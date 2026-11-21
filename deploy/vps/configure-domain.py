"""Enable the existing HTTPS edge after the user's domain points to this VPS."""
import argparse
import ipaddress
import json
from pathlib import Path
import re
import socket
import subprocess


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('domain', help='Hostname only; first point its A record to the VPS')
    parser.add_argument('--site-domain', help='Optional public website hostname served by the same frontend')
    parser.add_argument('--site-alias', help='Optional hostname redirected to the public website')
    parser.add_argument('--prepare-only', action='store_true',
                        help='Prepare and validate configuration without publishing or requiring DNS')
    args = parser.parse_args()
    domain = args.domain.encode('idna').decode('ascii').lower()
    if len(domain) > 253 or '.' not in domain or not all(
        re.fullmatch(r'[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?', part)
        for part in domain.split('.')
    ):
        parser.error('Supply a valid hostname without protocol, path, port or wildcard')
    try:
        ipaddress.ip_address(domain)
    except ValueError:
        pass
    else:
        parser.error('Supply a domain, not an IP address')
    if not args.prepare_only:
        addresses = {row[4][0] for row in socket.getaddrinfo(domain, 443, type=socket.SOCK_STREAM)}
        if addresses != {'179.66.156.112'}:
            parser.error(f'DNS must point only to 179.66.156.112 first; found {sorted(addresses)}')

    env_path = Path('/opt/littlebigcoders/application.env')
    environment = dict(line.split('=', 1) for line in env_path.read_text().splitlines()
                       if line and not line.startswith('#') and '=' in line)
    environment.update(ALLOWED_HOSTS=f'localhost,127.0.0.1,{domain}',
                       CORS_ALLOWED_ORIGINS=f'https://{domain}',
                       CSRF_TRUSTED_ORIGINS=f'https://{domain}')
    temporary = env_path.with_suffix('.env.next')
    temporary.write_text(''.join(f'{key}={value}\n' for key, value in environment.items()))
    temporary.chmod(0o600)
    temporary.replace(env_path)
    labels = {
        'traefik.enable': 'true', 'traefik.docker.network': 'coolify',
        'traefik.http.routers.littlebigcoders-http.rule': f'Host(`{domain}`)',
        'traefik.http.routers.littlebigcoders-http.entrypoints': 'http',
        'traefik.http.routers.littlebigcoders-http.middlewares': 'littlebigcoders-https',
        'traefik.http.middlewares.littlebigcoders-https.redirectscheme.scheme': 'https',
        'traefik.http.middlewares.littlebigcoders-https.redirectscheme.permanent': 'true',
        'traefik.http.routers.littlebigcoders-https.rule': f'Host(`{domain}`)',
        'traefik.http.routers.littlebigcoders-https.entrypoints': 'https',
        'traefik.http.routers.littlebigcoders-https.tls': 'true',
        'traefik.http.routers.littlebigcoders-https.tls.certresolver': 'letsencrypt',
        'traefik.http.routers.littlebigcoders-https.service': 'littlebigcoders-web',
        'traefik.http.services.littlebigcoders-web.loadbalancer.server.port': '80',
    }
    if args.site_domain:
        site_domain = args.site_domain.lower()
        if not re.fullmatch(r'(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}', site_domain):
            parser.error('Supply a valid website hostname')
        if not args.prepare_only:
            site_addresses = {row[4][0] for row in socket.getaddrinfo(site_domain, 443, type=socket.SOCK_STREAM)}
            if site_addresses != {'179.66.156.112'}:
                parser.error(f'Website DNS must point only to 179.66.156.112; found {sorted(site_addresses)}')
        labels.update({
            'traefik.http.routers.littlebigcoders-site-http.rule': f'Host(`{site_domain}`)',
            'traefik.http.routers.littlebigcoders-site-http.entrypoints': 'http',
            'traefik.http.routers.littlebigcoders-site-http.middlewares': 'littlebigcoders-https',
            'traefik.http.routers.littlebigcoders-site-http.service': 'littlebigcoders-web',
            'traefik.http.routers.littlebigcoders-site-https.rule': f'Host(`{site_domain}`)',
            'traefik.http.routers.littlebigcoders-site-https.entrypoints': 'https',
            'traefik.http.routers.littlebigcoders-site-https.tls': 'true',
            'traefik.http.routers.littlebigcoders-site-https.tls.certresolver': 'letsencrypt',
            'traefik.http.routers.littlebigcoders-site-https.service': 'littlebigcoders-web',
        })
    if args.site_alias:
        if not args.site_domain:
            parser.error('--site-alias requires --site-domain')
        alias = args.site_alias.lower()
        if not re.fullmatch(r'(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}', alias):
            parser.error('Supply a valid website alias')
        if not args.prepare_only:
            alias_addresses = {row[4][0] for row in socket.getaddrinfo(alias, 443, type=socket.SOCK_STREAM)}
            if alias_addresses != {'179.66.156.112'}:
                parser.error(f'Alias DNS must point only to 179.66.156.112; found {sorted(alias_addresses)}')
        labels.update({
            'traefik.http.routers.littlebigcoders-alias-http.rule': f'Host(`{alias}`)',
            'traefik.http.routers.littlebigcoders-alias-http.entrypoints': 'http',
            'traefik.http.routers.littlebigcoders-alias-http.middlewares': 'littlebigcoders-site-canonical',
            'traefik.http.routers.littlebigcoders-alias-http.service': 'littlebigcoders-web',
            'traefik.http.routers.littlebigcoders-alias-https.rule': f'Host(`{alias}`)',
            'traefik.http.routers.littlebigcoders-alias-https.entrypoints': 'https',
            'traefik.http.routers.littlebigcoders-alias-https.tls': 'true',
            'traefik.http.routers.littlebigcoders-alias-https.tls.certresolver': 'letsencrypt',
            'traefik.http.routers.littlebigcoders-alias-https.middlewares': 'littlebigcoders-site-canonical',
            'traefik.http.routers.littlebigcoders-alias-https.service': 'littlebigcoders-web',
            'traefik.http.middlewares.littlebigcoders-site-canonical.redirectregex.regex':
                r'^https?://' + re.escape(alias) + r'(?::[0-9]+)?/(.*)',
            'traefik.http.middlewares.littlebigcoders-site-canonical.redirectregex.replacement':
                f'https://{args.site_domain.lower()}/$${{1}}',
            'traefik.http.middlewares.littlebigcoders-site-canonical.redirectregex.permanent': 'true',
        })
    folder = Path(__file__).resolve().parent
    override = folder / 'domain.override.json'
    override.write_text(json.dumps({'services': {'web': {'labels': labels}}}, indent=2))
    compose = ['docker', 'compose', '-f', str(folder / 'compose.yaml'), '-f', str(override)]
    subprocess.run(compose + ['config', '--quiet'], check=True)
    if args.prepare_only:
        print(f'Prepared configuration for {domain}; HTTPS edge is not enabled yet.')
        return
    subprocess.run(compose + ['up', '-d', '--no-build'], check=True)
    print(f'HTTPS edge configured for https://{domain}; verify issuance and login before cutover.')


if __name__ == '__main__':
    main()
