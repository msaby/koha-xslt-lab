"""Extract pinned Koha Sass sources, or assets referenced by compiled CSS.

Usage: python scripts/extract-koha-styles.py ARCHIVE [--assets]
No archive paths are passed to extractall; only verified regular files are copied.
"""
import hashlib
import json
import re
import sys
import tarfile
from pathlib import Path, PurePosixPath

root = Path(__file__).resolve().parents[1]
target = root / 'content/koha/26.05.03'
archive = Path(sys.argv[1])
reference = json.loads((target / 'manifest.json').read_text())
assert hashlib.sha256(archive.read_bytes()).hexdigest() == reference['archiveSha256'], 'Unexpected Koha archive'
prefix = 'koha-26.05.03/'
bases = ['koha-tmpl/opac-tmpl/bootstrap/css', 'koha-tmpl/intranet-tmpl/prog/css']
manifest_path = target / 'styles-manifest.json'
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {
    'version': '26.05.03', 'source': reference['source'], 'archiveSha256': reference['archiveSha256'], 'files': {}}
with tarfile.open(archive) as tar:
    if '--assets' in sys.argv:
        names = json.loads((target / 'preview/asset-paths.json').read_text())
    else:
        names = [m.name[len(prefix):] for m in tar.getmembers() if m.isfile()
                 and any(m.name.startswith(prefix + base + '/src/') for base in bases)
                 and m.name.endswith('.scss')]
        names += ['gulpfile.js', 'package.json', 'yarn.lock', 'debian/copyright',
                  'koha-tmpl/opac-tmpl/lib/fontawesome/LICENSE.txt']
    for name in names:
        # These eight Poppins files are referenced by upstream Sass but absent
        # from the pinned release. The preview removes those font-face rules.
        if re.fullmatch(r'koha-tmpl/intranet-tmpl/prog/css/fonts/poppins-(regular|italic|bold|bolditalic)-webfont\.woff2?', name):
            if name not in manifest.setdefault('missingFonts', []):
                manifest['missingFonts'].append(name)
            continue
        relative = PurePosixPath(name)
        assert not relative.is_absolute() and '..' not in relative.parts
        member = tar.getmember(prefix + name)
        assert member.isfile(), name
        data = tar.extractfile(member).read()
        destination = target / name
        assert destination.resolve().is_relative_to(target.resolve())
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
        manifest['files'][name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Copied {len(names)} pinned Koha files')
