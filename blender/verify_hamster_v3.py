"""Independently inspect the exported binary GLB without relying on Blender stats."""
from pathlib import Path
import struct,json,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'web/public/models/hamster-v3.glb'
b=p.read_bytes()
magic,version,total=struct.unpack_from('<III',b)
assert magic==0x46546c67 and version==2 and total==len(b)
length,kind=struct.unpack_from('<II',b,12)
assert kind==0x4e4f534a
g=json.loads(b[20:20+length])
tris=0;primitives=[]
for m in g['meshes']:
    for primitive in m['primitives']:
        assert primitive.get('mode',4)==4
        count=g['accessors'][primitive['indices']]['count']
        assert count%3==0
        tris+=count//3
        primitives.append({'mesh':m.get('name'),'triangles':count//3,'vertices':g['accessors'][primitive['attributes']['POSITION']]['count']})
required=['HamsterRoot','Head','Eye_L','Eye_R','Arm_L','Arm_R']
names={n.get('name') for n in g['nodes']}
assert all(n in names for n in required)
assert 1000000<=tris<=1050000
assert len(b)<50*1024*1024
source=json.loads((ROOT/'docs/redesign-v3-2026-09-08/model-stats.json').read_text())
assert source['triangles']==tris
old={}
for name in ['web/public/models/hamster-v2.glb','web/public/models/ai-hamster.glb','blender/hamster-v2.blend','blender/sen.blend']:
    file=ROOT/name
    if file.exists():
        old[name]={'working_sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'git_status':subprocess.check_output(['git','status','--porcelain','--',name],cwd=ROOT,text=True).strip()}
        assert old[name]['git_status']=='',f'Previous asset modified: {name}'
report={'verified_at':'2026-09-08','method':'independent GLB binary header + JSON accessor index counts','triangles':tris,'blender_polygons':source['blender_polygons'],'glb_bytes':len(b),'glb_sha256':hashlib.sha256(b).hexdigest(),'required_nodes_present':required,'nodes':len(g['nodes']),'mesh_count':len(g['meshes']),'materials':len(g['materials']),'external_buffers':sum(bool(x.get('uri')) for x in g.get('buffers',[])),'primitives':primitives,'previous_assets':old}
(ROOT/'docs/redesign-v3-2026-09-08/model-asset-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k not in ['primitives','previous_assets']},indent=2))
