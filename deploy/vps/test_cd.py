"""Verify that failed deployments cannot be recorded as successful."""
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('cd', Path(__file__).with_name('cd.py'))
cd = importlib.util.module_from_spec(spec)
# fcntl is Linux-only; tests also run on the Windows development machine.
import sys
from unittest.mock import Mock
sys.modules.setdefault('fcntl', Mock(LOCK_EX=2, LOCK_NB=4))
spec.loader.exec_module(cd)


class DeploymentSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='cd-test-', dir=Path(__file__).resolve().parents[2] / 'tmp')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.state = self.root / 'cd'
        self.state.mkdir()
        (self.root / 'migration/backups').mkdir(parents=True)
        self.previous = {'commit': 'old', 'compose': ['docker', 'compose', '-f', 'old.yaml']}
        (self.state / 'deployed.json').write_text(json.dumps(self.previous))
        self.calls = []
        self.fail_build = False
        self.patches = [patch.object(cd, 'ROOT', self.root), patch.object(cd, 'STATE', self.state),
                        patch.object(cd, 'REPO', self.root / 'source'), patch.object(cd, 'run', self.run_command),
                        patch.object(cd, 'output', return_value='new'), patch.object(cd.time, 'sleep'),
                        patch.object(sys, 'argv', ['cd.py']), patch.object(cd.os, 'umask')]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)

    def run_command(self, *args, **kwargs):
        self.calls.append(list(args))
        if 'archive' in args:
            with tarfile.open(fileobj=kwargs['stdout'], mode='w') as package:
                data = b'name: littlebigcoders\nservices: {}\n'
                entry = tarfile.TarInfo('deploy/vps/compose.yaml')
                entry.size = len(data)
                package.addfile(entry, io.BytesIO(data))
        if args[:2] == ('docker', 'build') and self.fail_build:
            raise RuntimeError('build failed')
        if 'pg_dump' in args:
            kwargs['stdout'].write(b'backup' * 1000)

    def test_build_failure_preserves_running_release(self):
        self.fail_build = True
        with self.assertRaisesRegex(RuntimeError, 'build failed'):
            cd.main()
        self.assertEqual(json.loads((self.state / 'deployed.json').read_text()), self.previous)
        self.assertEqual(json.loads((self.state / 'failed.json').read_text())['commit'], 'new')
        self.assertFalse(any('up' in call or 'migrate' in call for call in self.calls))

    def test_unhealthy_release_rolls_back_images_without_marking_success(self):
        with patch.object(cd, 'check_live', side_effect=RuntimeError('unhealthy')):
            with self.assertRaisesRegex(RuntimeError, 'unhealthy'):
                cd.main()
        self.assertIn(self.previous['compose'] + ['up', '-d', '--no-build'], self.calls)
        self.assertEqual(json.loads((self.state / 'deployed.json').read_text()), self.previous)

    def test_success_records_verified_commit_and_backup(self):
        with patch.object(cd, 'check_live') as check:
            cd.main()
        check.assert_called_once_with('new')
        record = json.loads((self.state / 'deployed.json').read_text())
        self.assertEqual(record['commit'], 'new')
        self.assertTrue(Path(record['backup']).with_suffix('.dump.sha256').exists())
        self.assertFalse((self.state / 'failed.json').exists())

    def test_previously_failed_commit_waits_for_new_push(self):
        (self.state / 'failed.json').write_text(json.dumps({'commit': 'new'}))
        cd.main()
        self.assertFalse(any(call[:2] == ['docker', 'build'] for call in self.calls))


if __name__ == '__main__':
    unittest.main()
