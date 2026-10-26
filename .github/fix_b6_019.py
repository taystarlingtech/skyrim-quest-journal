import hashlib
from pathlib import Path

p = Path("pages-parts/b6/019")
data = p.read_bytes()
expect = "07a43d13a5f3d81bca7af2958bf2ee61286e8187"

def blob(buf):
    return hashlib.sha1(b"blob %d\0" % len(buf) + buf).hexdigest()

if blob(data) == expect and len(data) == 9000:
    raise SystemExit(0)
if len(data) != 9001 or not data.endswith(b"[eX]"):
    raise SystemExit("unexpected %s %s" % (len(data), data[-8:]))
data = data[:-1]
digest = blob(data)
if digest != expect or len(data) != 9000:
    raise SystemExit("bad %s %s" % (digest, len(data)))
p.write_bytes(data)
