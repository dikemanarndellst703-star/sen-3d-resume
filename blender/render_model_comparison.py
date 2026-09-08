"""Render both preserved V1 and new V2 with identical studio camera and lighting.

The V1 model is normalized to the V2 height and turned to face the camera as in
the original website. Neither the V1 GLB nor the V2 .blend is modified.
"""
import bpy
import os
from math import pi
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'redesign-2026-09-08')
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'blender', 'hamster-v2.blend'))
scene = bpy.context.scene
scene.render.resolution_x = 1050
scene.render.resolution_y = 1200
scene.cycles.samples = 40
scene.render.filepath = os.path.join(OUT, 'model-v2-studio.png')
bpy.ops.render.render(write_still=True)
for obj in list(scene.objects):
    if obj.type == 'MESH': obj.hide_render = True
before = set(scene.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'web', 'public', 'models', 'ai-hamster.glb'))
imported = [o for o in scene.objects if o not in before]
root = bpy.data.objects.new('V1 comparison normalization', None)
bpy.context.collection.objects.link(root)
for obj in imported:
    if not obj.parent:
        world = obj.matrix_world.copy()
        obj.parent = root
        obj.matrix_world = world
root.rotation_euler.z = -pi / 2
bpy.context.view_layer.update()
def bounds():
    points = [obj.matrix_world @ Vector(c) for obj in imported if obj.type == 'MESH' for c in obj.bound_box]
    return [min(p[k] for p in points) for k in range(3)], [max(p[k] for p in points) for k in range(3)]
lo, hi = bounds()
root.scale *= 3.59 / (hi[2] - lo[2])
bpy.context.view_layer.update()
lo, hi = bounds()
root.location = (-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2])
bpy.context.view_layer.update()
scene.render.filepath = os.path.join(OUT, 'model-v1-studio.png')
bpy.ops.render.render(write_still=True)
print('MODEL_COMPARISON_RENDER_COMPLETE')
