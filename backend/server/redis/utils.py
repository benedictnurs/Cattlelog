import orjson, gzip, hashlib

def to_bytes(obj, compress=False):
    b = orjson.dumps(obj, option=orjson.OPT_SERIALIZE_NUMPY)
    return gzip.compress(b) if compress else b

def from_bytes(b, compressed=False):
    return orjson.loads(gzip.decompress(b) if compressed else b)

def stable_hash(items: list[str]) -> str:
    return hashlib.sha1(",".join(sorted(items)).encode()).hexdigest()
