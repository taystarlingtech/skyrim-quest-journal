import hashlib
from pathlib import Path
parts = [
    ("000", "ea76de002d657d73fa210a9b2f2f73a3735abad2", 9000),
    ("001", "5c46aef94e6062a177e5e2a541aca61145031a50", 9000),
    ("002", "16bff21d77ee9e65c47512c386f09374feef4b73", 9000),
    ("003", "d7393ef597360146ebac476da568a14523de351a", 9000),
    ("004", "bb9d3ac44d9246ecd0bc0f4f0bcda8fca0ec159a", 9000),
    ("005", "c9cd7276b2530c26206d63e5c81ac39c05972307", 9000),
    ("006", "df6ed0ed843504ac1e8bc9a177b25a88da499273", 9000),
    ("007", "a524e3d532ed8bbbd3ba895b5a6d6e60550f44cc", 9000),
    ("008", "3b2967ac260d4a63a531eba49d0a17d26de6a173", 9000),
    ("009", "cfc86b13e86695bce6f0250b25d5a2525aed3bdd", 9000),
    ("010", "6cf74ce71b13e355d73b36724d6a486447ab8980", 9000),
    ("011", "fedc0b530e3f4a88f4fb65233cc6da1ce7d03e6b", 9000),
    ("012", "23039c2928f3639416e0dd1bc3ace0a6e46394ed", 9000),
    ("013", "687ff714a50a8937ed14aa054c13f5e0e0e950e9", 9000),
    ("014", "16f385b32c4cbf3812bbaccd90d2edb67229f0a2", 9000),
    ("015", "16df8be42bfdfbabea2bcb1cb28b8eca5062cfaf", 9000),
    ("016", "f92f7f10dcb3e050febf10c1af3c15b422850bc0", 9000),
    ("017", "36e27f1f67fd6cb146bf08607eaf08bf12e008fa", 9000),
    ("018", "042f040de9c8118e6de7473811cca4cbbd82eef5", 9000),
    ("019", "829cded9466e477cb504b63dd21b527f772edb64", 9000),
    ("020", "bcd89f77b894ae973e16c540820bddb34b29090a", 6024),
]
buf = bytearray()
for name, sha, size in parts:
    data = Path("pages-parts/b1", name).read_bytes()
    digest = hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()
    if digest != sha or len(data) != size:
        raise SystemExit("bad %s %s %s" % (name, digest, len(data)))
    buf += data
digest = hashlib.sha1(b"blob %d\0" % len(buf) + buf).hexdigest()
if digest != "49ecccba05d992f5949198f445c9180f5138a4d9" or len(buf) != 186024:
    raise SystemExit("bad out %s %s" % (digest, len(buf)))
out = Path("_next/static/chunks/0488y5j0fgpsj.js")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(bytes(buf))
