"""Render final detail evidence and an identical-camera V2/V3 comparison."""
import bpy
import os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'docs','redesign-v3-2026-09-08','model-renders')
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'blender','hamster-v3.blend'))
scene=bpy.context.scene
scene.cycles.samples=40
scene.render.resolution_x=1400
scene.render.resolution_y=1400
cam=scene.camera

def shot(name, location, target, scale):
    cam.location=location
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.ortho_scale=scale
    scene.render.filepath=os.path.join(OUT,name+'.png')
    bpy.ops.render.render(write_still=True)

shot('v3-front',(0,-12,2.8),(0,0,1.82),4.1)
shot('v3-face-detail',(2.25,-10,3.2),(0,-.13,2.65),2.75)
shot('v3-backpack-detail',(3.5,9.5,3.4),(0,.40,1.31),2.35)
shot('v3-comparison',(3.2,-10.5,3.5),(0,0,1.81),4.25)
# Retain V3 lighting and camera. Import V2 and normalize height for direct comparison.
for obj in list(scene.objects):
    if obj.type=='MESH':obj.hide_render=True
before=set(scene.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'web','public','models','hamster-v2.glb'))
imported=[o for o in scene.objects if o not in before]
root=bpy.data.objects.new('V2 comparison normalization',None)
bpy.context.collection.objects.link(root)
for obj in imported:
    if obj.parent is None:
        world=obj.matrix_world.copy();obj.parent=root;obj.matrix_world=world
bpy.context.view_layer.update()
coords=[obj.matrix_world @ Vector(c) for obj in imported if obj.type=='MESH' for c in obj.bound_box]
lo=min(p.z for p in coords);hi=max(p.z for p in coords)
root.scale=(3.6/(hi-lo),)*3;root.location.z=-lo*root.scale.z
bpy.context.view_layer.update()
shot('v2-comparison',(3.2,-10.5,3.5),(0,0,1.81),4.25)
print('V3_DETAIL_RENDER_COMPLETE')
