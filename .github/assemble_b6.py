import hashlib
from pathlib import Path

parts = [
    ("000", "e26fe6b64232680803169c4feba29740c92f7085", 9000),
    ("001", "f76aff5bbbfbc11dc848edd5c501455c44eff296", 9000),
    ("002", "7cff22c961f000828199beae550aff22a5278ec8", 9000),
    ("003", "21e4db299656705eac87dad0662136ba902c7316", 9000),
    ("004", "43a2bf267f16c75388660b7920d08af55e6f741b", 9000),
    ("005", "03359b39aa9a5f67ea9c5e942a71059972bd7c4c", 9000),
    ("006", "e97625adb906930150488ec36da3db16aa7f591b", 9000),
    ("007", "56933989e22ade019e6ca63bd2ab3fd82baab2b6", 9000),
    ("008", "989e85f748d2d91508de02d59ae6aac51c8f4c7a", 9000),
    ("009", "7bd615735c2382eeac9875012bb5f5ff091265f7", 9000),
    ("010", "ee85120d2a310e582c5c92b43d7c48bdad7b1ab2", 9000),
    ("011", "f53027ff18e3cb33349e64a867a3605acea3f725", 9000),
    ("012", "0ba35ba4d68fcadc38ef713b9b75a4e767a90806", 9000),
    ("013", "df2e14d0dab907dbe12f021f13a8eb4b143623a3", 9000),
    ("014", "b7c4659c43224641920aac567c7c80a851afdc73", 9000),
    ("015", "26f87501b0315f6906087b6db04b4f3a0e31e43b", 9000),
    ("016", "673945517df38a1c59ad12bb7970208fb6c20415", 9000),
    ("017", "c964e7ed9e03ed81a52103d8fbcb939c9734592d", 9000),
    ("018", "c14fb837bd4183700229deec544d005c6478d28f", 9000),
    ("019", "07a43d13a5f3d81bca7af2958bf2ee61286e8187", 9000),
    ("020", "b594aba59e36f72961d19cbea2dc3d851284d3cf", 9000),
    ("021", "57cc9bac5cd0ef034302011929694822c31bc638", 9000),
    ("022", "f9f64a1bddbfcff8f56608ff8b59e5e7890e7d19", 9000),
    ("023", "dfd0d1439e7c5a26ff3e17e045315df943ebeddc", 9000),
    ("024", "9638e8ff7b160a46d98b277aa15e502bd61d34cc", 9000),
    ("025", "11179c2504b15c31fd62a0134a79614946a218d0", 4820),
]
buf = bytearray()
for name, sha, size in parts:
    data = Path("pages-parts/b6", name).read_bytes()
    digest = hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()
    if digest != sha or len(data) != size:
        raise SystemExit("bad %s %s %s" % (name, digest, len(data)))
    buf += data
digest = hashlib.sha1(b"blob %d\0" % len(buf) + buf).hexdigest()
if digest != "570a95423ec544650f553e1b4ab2bb2c2fa747d9" or len(buf) != 229820:
    raise SystemExit("bad out %s %s" % (digest, len(buf)))
out = Path("_next/static/chunks/2khxl0v1q4i6n.js")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(bytes(buf))
