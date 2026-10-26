import hashlib
from pathlib import Path
parts = [
    ("000", "3102c5b899180f2fdaee026310dfe95f9bef9462", 9001),
    ("001", "a1959dd8a94dfacfa7a945ebfe7ce0ab0b58c31b", 9000),
    ("002", "96575c4be4891a1df17f206671ec98ef40d6ad8d", 9000),
    ("003", "f443d48d9b44f8afec8e3a42581f6137ddcdb448", 9031),
    ("004", "72cf781f5a770fca207ef64615946d2d7aa66d8c", 9000),
    ("005", "87ee4e349e250a77e40c730074e0a783420886c6", 9000),
    ("006", "2df255416aed6046b1b8794d0fd37d3649e29d8e", 9000),
    ("007", "9e01f79211f5e0a53caf4342a213a6eedade1f9d", 9015),
    ("008", "57149db0d875b01662d1c375d1a0bf925b3afb3c", 9006),
    ("009", "68c1b3c6f0efaf928e898bb6b9d6eebd2ee542e3", 9000),
    ("010", "7fc9965c0b8562b9be63324ecdd29f0331cfe90b", 9000),
    ("011", "d8113dfa3c873eb6dc3029a01a458cdf6ce0680d", 9000),
    ("012", "76d307c81c8d16ff21e5a62d3d75f20dac12aece", 4541),
]
buf = bytearray()
for name, sha, size in parts:
    data = Path("pages-parts/b3", name).read_bytes()
    digest = hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()
    if digest != sha or len(data) != size:
        raise SystemExit("bad %s %s %s" % (name, digest, len(data)))
    buf += data
digest = hashlib.sha1(b"blob %d\0" % len(buf) + buf).hexdigest()
if digest != "ab422b94a4fbe76275d31c0bf7ef334768b39cae" or len(buf) != 112594:
    raise SystemExit("bad out %s %s" % (digest, len(buf)))
out = Path("_next/static/chunks/0cz1d0mv5g_q7.js")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(bytes(buf))
