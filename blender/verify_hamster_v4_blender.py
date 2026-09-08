"""Reopen the saved clay source and independently import the exact runtime GLB."""
import bpy, bmesh, json, math
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'docs/redesign-v4-clay-2026-09-08'
def measure():
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    points = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    per_mesh = []
    for o in meshes:
        o.data.calc_loop_triangles()
        assert all(math.isfinite(c) for v in o.data.vertices for c in v.co)
        bm=bmesh.new();bm.from_mesh(o.data)
        per_mesh.append({'name':o.name,'polygons':len(o.data.polygons),'triangles':len(o.data.loop_triangles),'vertices':len(o.data.vertices),'open_edges':sum(e.is_boundary for e in bm.edges),'non_manifold_edges':sum(not e.is_manifold for e in bm.edges)})
        bm.free()
    bounds={'min':[min(p[k] for p in points) for k in range(3)],'max':[max(p[k] for p in points) for k in range(3)]}
    return {'polygons':sum(m['polygons'] for m in per_mesh),'triangles':sum(m['triangles'] for m in per_mesh),'blender_bounds':bounds,'height':bounds['max'][2]-bounds['min'][2],'meshes':per_mesh}
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'blender/hamster-v4-clay.blend'))
bpy.context.view_layer.update()
saved=measure()
assert 1_000_000 <= saved['polygons'] <= 1_100_000
assert saved['polygons'] == saved['triangles']
body=max(saved['meshes'],key=lambda m:m['polygons'])
assert body['open_edges'] == 0 and body['non_manifold_edges'] == 0, body
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'web/public/models/hamster-v4-clay.glb'))
bpy.context.view_layer.update()
reimported=measure()
assert reimported['polygons'] == reimported['triangles'] == saved['triangles']
assert abs(reimported['height']-saved['height']) < .0001
result={'status':'pass','method':'Saved Blender actual polygons and independent GLB reimport; largest sculpture mesh checked for boundary/non-manifold edges','saved_blend':saved,'reimported_glb':reimported}
(OUT/'model-blender-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('VERIFIED',saved['polygons'],'saved polygons;',reimported['triangles'],'runtime triangles;',body['open_edges'],'body open edges')
