"""Generate PWA icon PNGs from favicon.svg on macOS.

This script uses macOS Quick Look (`qlmanage`) to render the SVG and `sips`
to resize that render into the app icon assets checked into the repo.
"""

import platform
import shutil
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'favicon.svg'


def run_command(command):
    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        details = exc.stderr.strip() or exc.stdout.strip() or str(exc)
        joined = ' '.join(command)
        raise SystemExit(f'Command failed: {joined}\n{details}') from exc


def require_tool(name, reason):
    if not shutil.which(name):
        raise SystemExit(f'{name} is required to {reason}')


def main():
    if platform.system() != 'Darwin':
        raise SystemExit('This icon generator currently supports macOS only.')
    if not SOURCE.exists():
        raise SystemExit(f'Source SVG not found: {SOURCE}')

    require_tool('qlmanage', 'render favicon.svg')
    require_tool('sips', 'resize icon assets')

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        run_command(
            [
                'qlmanage',
                '-t',
                '-s',
                '1024',
                '-o',
                str(temp_path),
                str(SOURCE),
            ]
        )

        rendered = temp_path / f'{SOURCE.name}.png'
        if not rendered.exists():
            raise SystemExit(f'Expected rendered preview was not created: {rendered}')

        outputs = {
            ROOT / 'icon-512.png': 512,
            ROOT / 'icon-192.png': 192,
            ROOT / 'apple-touch-icon.png': 180,
        }

        for output, size in outputs.items():
            run_command(['sips', '-Z', str(size), str(rendered), '--out', str(output)])
            if not output.exists():
                raise SystemExit(f'Failed to write icon asset: {output}')


if __name__ == '__main__':
    main()
