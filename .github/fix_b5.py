import hashlib, pathlib, sys
p = pathlib.Path('_next/static/chunks/2djzry4zyjj8w.js')
text = p.read_text(encoding='utf-8')
repls = [
    ('0000000000000000\\xcb000000000000000000000\\xde000000000000000000\\xf00000000\\xf80\\xf9\\xfa\\xfb\\xfc\\xfd\\xfe\\xff\\u0100\\u0101\\u0102\\u0103\\u0104\\u0105\\u01060000000000000', '000000000000\\xcb000000000000000000000\\xde000000000000000000\\xf00000000\\xf80\\xf9\\xfa\\xfb\\xfc\\xfd\\xfe\\xff\\u0100\\u0101\\u0102\\u0103\\u0104\\u0105\\u0106000000000000'),
    ('2222222222\\u013f\\u01422222222222222', '2222222222\\u013f\\u0142222222222222'),
    ('22\\u02b7\\u02ba\\u02b72\\u02b8\\u02b742\\u02b42\\u029d22>621422\\u0276222\\u0279\\u027c\\u0277\\u027a\\u0277\\u027a22\\u027142222\\u02682\\u026726622\\u0259\\u0252244\\u01b8\\u01b5222]d24242\\u01d6\\u01d3\\u019a\\xc4\\u022b2263\\u0228\\u0225\\u02282222222\\u01e3222222222222222222\\u01c62\\u01be\\u01b52222222422222\\u019c\\u01912222222222222222222222144\\u0166\\u016322\\u0162\\u015f222222222222222222222\\u01382\\u013168\\u0126\\u0123\\u0121\\u01704\\u0120\\xab\\xae\\u011d822\\u0114\\u0111\\u0114', '22\\u02b7\\u02ba\\u02b72\\u02b8\\u02b742\\u02b42\\u029322>621422\\u0276222\\u0279\\u027c\\u0277\\u027a\\u0277\\u027a22\\u027142222\\u02682\\u026726622\\u0258\\u0253244\\u01b8\\u01b5222]d24242\\u01d6\\u01d3\\u019a\\xc4\\u022b2263\\u0228\\u0225\\u02282222222\\u01e3222222222222222222\\u01c2\\u01bd2\\u01be\\u01b52222222422222\\u019c\\u019122222222222222222222144\\u0166\\u016322\\u0162\\u015f222222222222222222222\\u01382\\u013168\\u0126\\u0123\\u0126\\u0261\\u01704\\u0120\\xab\\xae\\u011d822\\u0114\\u0111\\u0114'),
    ('2\\u02c9\\xba\\u0174\\u017d2R2=18c\\u01f4\\xc5\\u0147\\u015c=c\\u011e\\xdbC1\\u0188\\u01dd\\u0208:\\u01272', '2\\u02c9\\xba\\u0174\\u017d2R2=18c\\u01b4\\xc5\\u0147\\x9c=c\\u011e\\xdbC1\\u0188\\u01dd\\u0208:\\u01272'),
]
for old_e, new_e in repls:
    old = old_e.encode('utf-8').decode('unicode_escape')
    new = new_e.encode('utf-8').decode('unicode_escape')
    c = text.count(old)
    if c != 1:
        print('count', c, 'for', old_e[:40])
        sys.exit(1)
    text = text.replace(old, new, 1)
raw = text.encode('utf-8')
sha = hashlib.sha1(b'blob %d\0' % len(raw) + raw).hexdigest()
expect = 'fe57f0fdefed38f06d9e76272c7085a2552248d9'
print(sha, len(raw))
if sha != expect or len(raw) != 82175:
    sys.exit(2)
p.write_text(text, encoding='utf-8')
print('patched')
