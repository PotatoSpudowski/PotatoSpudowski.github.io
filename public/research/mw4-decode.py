"""Read-only reconstruction of one codpatch embedded record decoder.
Usage: python3 mw4-decode.py /path/to/codpatch
Reads bytes only. Never executes the input, attaches to a process or writes files.
Only accepts the exact binary inspected for the article.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys

EXPECTED = 'cd2bec4f40cbdf8aacdbc7917634d3600eca64b82018baea49aacf06c52ce915'
b = Path(sys.argv[1]).read_bytes()
if hashlib.sha256(b).hexdigest() != EXPECTED:
    raise SystemExit('Different helper build; offsets are not applicable.')
seed = (b[0xaf490:0xaf4a0] + bytes(16) + b[0xaf4a0:0xaf4c0]
        + b[0xc8260:0xc8280] + b[0xaf4c0:0xaf4d0])
key = bytes(x ^ y for x, y in zip(hashlib.sha256(seed).digest(), seed[:32]))

def rotate(v, n):
    return ((v << n) | (v >> (32 - n))) & 0xffffffff

def block(counter):
    initial = (list(struct.unpack('<4I', b'expand 32-byte k'))
               + list(struct.unpack('<8I', key))
               + [counter, 0xa19a12a4, 0xf6992451, 0x1c4543e9])
    x = initial.copy()
    def quarter(a, b, c, d):
        x[a] = (x[a] + x[b]) & 0xffffffff
        x[d] = rotate(x[d] ^ x[a], 16)
        x[c] = (x[c] + x[d]) & 0xffffffff
        x[b] = rotate(x[b] ^ x[c], 12)
        x[a] = (x[a] + x[b]) & 0xffffffff
        x[d] = rotate(x[d] ^ x[a], 8)
        x[c] = (x[c] + x[d]) & 0xffffffff
        x[b] = rotate(x[b] ^ x[c], 7)
    for _ in range(10):
        for indices in ((0,4,8,12), (1,5,9,13), (2,6,10,14), (3,7,11,15),
                        (0,5,10,15), (1,6,11,12), (2,7,8,13), (3,4,9,14)):
            quarter(*indices)
    return struct.pack('<16I', *((a + c) & 0xffffffff for a, c in zip(x, initial)))

plain = bytes(a ^ c for a, c in zip(
    b[0xc6260:0xc8260], b''.join(block(i) for i in range(1, 129))))
magic, version, length, count = struct.unpack_from('<4sIII', plain)
if (magic, version, length, count) != (b'CPW1', 1, 557, 32):
    raise SystemExit('Unexpected decoded header.')
records = []
pos = 16
for _ in range(count):
    if pos + 5 > length:
        raise SystemExit('Truncated record header.')
    kind, size = struct.unpack_from('<BI', plain, pos)
    if pos + 5 + size > length:
        raise SystemExit('Truncated record body.')
    data = plain[pos + 5:pos + 5 + size]
    record = {'type': kind, 'size': size, 'hex': data.hex()}
    if kind in (3, 4):
        field, units = struct.unpack_from('<HH', data)
        width = 2 if kind == 4 else 1
        if len(data) != 4 + units * width:
            raise SystemExit('Unexpected string record size.')
        record.update(field=field, text=data[4:].decode('utf-16-le' if kind == 4 else 'ascii').rstrip('\0'))
    records.append(record)
    pos += 5 + size
if pos != length:
    raise SystemExit('Unexpected record boundary.')
print(json.dumps({'helper_sha256': EXPECTED, 'length': length, 'records': records}, indent=2))
