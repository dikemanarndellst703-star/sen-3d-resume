"""Independent binary validation for the V4 source-derived clay GLB."""
from pathlib import Path
import array, hashlib, json, math, struct, subprocess, sys
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/redesign-v4-clay-2026-09-08'
p = ROOT / 'web/public/models/hamster-v4-clay.glb'
b = p.read_bytes()
assert struct.unpack_from('<III', b) == (0x46546c67, 2, len(b))
length, kind = struct.unpack_from('<II', b, 12)
assert kind == 0x4e4f534a
g = json.loads(b[20:20+length])
bin_length, bin_kind = struct.unpack_from('<II', b, 20+length)
assert bin_kind == 0x004e4942
binary = memoryview(b)[28+length:28+length+bin_length]
assert not any(x.get('uri') for x in g.get('buffers', []))
assert not any(x.get('uri') for x in g.get('images', []))

def values(accessor_index):
    a = g['accessors'][accessor_index]
    v = g['bufferViews'][a['bufferView']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    fmt = {5121: 'B', 5123: 'H', 5125: 'I', 5126: 'f'}[a['componentType']]
    size = struct.calcsize('<'+fmt)*n
    start = v.get('byteOffset', 0)+a.get('byteOffset', 0)
    stride = v.get('byteStride', size)
    assert start+(a['count']-1)*stride+size <= len(binary)
    if stride == size:
        data = array.array(fmt)
        data.frombytes(binary[start:start+a['count']*size])
        if sys.byteorder != 'little': data.byteswap()
        return data
    return [x for i in range(a['count']) for x in struct.unpack_from('<'+fmt*n, binary, start+i*stride)]

triangles = 0
primitives = []
for mesh in g['meshes']:
    for p0 in mesh['primitives']:
        assert p0.get('mode', 4) == 4
        indices = values(p0['indices'])
        vertices = g['accessors'][p0['attributes']['POSITION']]['count']
        assert len(indices) % 3 == 0 and max(indices) < vertices
        assert all(math.isfinite(x) for x in values(p0['attributes']['POSITION']))
        triangles += len(indices)//3
        primitives.append({'mesh': mesh.get('name'), 'triangles': len(indices)//3, 'vertices': vertices})
assert 1_000_000 <= triangles <= 1_100_000, triangles
assert len(b) < 60*1024*1024
source = json.loads((OUT/'model-stats.json').read_text())
if 'triangles' in source: assert source['triangles'] == triangles
previous = {}
for name in ['web/public/models/ai-hamster.glb','web/public/models/hamster-v2.glb','web/public/models/hamster-v3.glb','blender/sen.blend','blender/hamster-v2.blend','blender/hamster-v3.blend']:
    file = ROOT/name
    if not file.exists(): continue
    status = subprocess.check_output(['git','status','--porcelain','--',name],cwd=ROOT,text=True).strip()
    assert not status, f'Historical asset changed: {name}'
    previous[name] = {'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'git_status': status}
assert previous['web/public/models/ai-hamster.glb']['sha256'] == 'f196abdedb71ff60ed22014b88551f9f4c4f244b3b53d0de821f667bae4ec94c'
result = {'status':'pass','method':'Independent GLB binary header, actual index values and positions; no external buffers/images; preserved source hash','triangles':triangles,'glb_bytes':len(b),'glb_sha256':hashlib.sha256(b).hexdigest(),'mesh_count':len(g['meshes']),'materials':len(g.get('materials',[])),'nodes':[n.get('name') for n in g.get('nodes',[])],'primitives':primitives,'previous_assets':previous}
(OUT/'model-asset-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['nodes','primitives','previous_assets']},indent=2))
