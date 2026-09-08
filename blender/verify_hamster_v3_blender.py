"""Read the saved .blend and independently re-import its exported GLB."""
import bpy,json,os,math
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'docs','redesign-v3-2026-09-08')
required=['HamsterRoot','Head','Eye_L','Eye_R','Arm_L','Arm_R']
def measure(objects):
    meshes=[o for o in objects if o.type=='MESH']
    points=[o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    poly=sum(len(o.data.polygons) for o in meshes)
    tri=0
    for o in meshes:
        o.data.calc_loop_triangles();tri+=len(o.data.loop_triangles)
    bounds={'min':[min(p[k] for p in points) for k in range(3)],'max':[max(p[k] for p in points) for k in range(3)]}
    return {'polygons':poly,'triangles':tri,'meshes':len(meshes),'blender_bounds':bounds,'height':bounds['max'][2]-bounds['min'][2]}
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'blender','hamster-v3.blend'))
bpy.context.view_layer.update()
master=measure(list(bpy.context.scene.objects))
assert master['polygons']==1018268==master['triangles']
assert all(bpy.data.objects.get(n) is not None for n in required)
assert abs(master['height']-3.6)<.0001
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'web','public','models','hamster-v3.glb'))
bpy.context.view_layer.update()
imported=measure(list(bpy.context.scene.objects))
assert imported['polygons']==master['polygons']==imported['triangles']
assert abs(imported['height']-3.6)<.0001
nodes={n:{'parent':bpy.data.objects[n].parent.name if bpy.data.objects[n].parent else None,'location':list(bpy.data.objects[n].location),'scale':list(bpy.data.objects[n].scale)} for n in required}
result={'method':'Open final .blend, count evaluated saved mesh polygons; clean scene and re-import final GLB with Blender glTF importer','saved_blend':master,'reimported_glb':imported,'runtime_nodes':nodes}
with open(os.path.join(OUT,'model-blender-verification.json'),'w') as f:json.dump(result,f,ensure_ascii=False,indent=2)
print('BLENDER_VERIFIED',json.dumps(result))
