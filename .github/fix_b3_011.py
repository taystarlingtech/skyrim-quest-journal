from pathlib import Path
import hashlib
p = Path("pages-parts/b3/011")
data = p.read_bytes()
old = b"""dy read"));t.bodyUsed=!0}function rb(t){var e=new FileReader,r=rb(e);return e.readAsArrayBuffer(t),r}function nb(t){var """
new = b"""dy read"));t.bodyUsed=!0}function rb(t){return new Promise(function(e,r){t.onload=function(){e(t.result)},t.onerror=function(){r(t.error)}})}function nb(t){var """
count = data.count(old)
if count != 1:
    raise SystemExit("count %s" % count)
data = data.replace(old, new, 1)
digest = hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()
if digest != "d8113dfa3c873eb6dc3029a01a458cdf6ce0680d" or len(data) != 9000:
    raise SystemExit("bad %s %s" % (digest, len(data)))
p.write_bytes(data)
