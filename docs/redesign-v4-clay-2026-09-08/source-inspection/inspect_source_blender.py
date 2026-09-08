"""Read-only source import/measurement/render. Never saves or overwrites source GLB."""
import bpy,json,os,math
from collections import Counter,defaultdict
from mathutils import Vector
import numpy as np
OUT=os.path.dirname(os.path.abspath(__file__))
SRC='/Users/lingze/Desktop/文件夹合集/大表哥站外引流/tripo_convert_bfa920ab-ad7b-44e1-b2ac-2ceb65744036.glb'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=SRC)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
report={'source':SRC,'blender_version':bpy.app.version_string,'observed_front_direction':{'blender':'+X','gltf':'+X'},'meshes':[],'images':[]}
for im in bpy.data.images:
    if im.name not in ['Render Result','Viewer Node']:
        report['images'].append({'name':im.name,'size':list(im.size),'channels':im.channels,'colorspace':im.colorspace_settings.name,'packed':bool(im.packed_file)})

def components(coords,edges,weld=False):
    size=len(coords);parent=list(range(size));rank=[0]*size
    def find(a):
        while parent[a]!=a:
            parent[a]=parent[parent[a]];a=parent[a]
        return a
    def union(a,b):
        a=find(int(a));b=find(int(b))
        if a==b:return
        if rank[a]<rank[b]:a,b=b,a
        parent[b]=a
        if rank[a]==rank[b]:rank[a]+=1
    if weld:
        groups={}
        for i,p in enumerate(coords):
            key=tuple(np.round(p*1000000).astype(np.int64))
            if key in groups:union(i,groups[key])
            else:groups[key]=i
    for a,b in edges:union(a,b)
    groups=defaultdict(list)
    for i in range(size):groups[find(i)].append(i)
    output=[]
    for ids in sorted(groups.values(),key=len,reverse=True):
        pts=coords[ids]
        output.append({'vertices':len(ids),'bounds':{'min':pts.min(axis=0).tolist(),'max':pts.max(axis=0).tolist()},'center':pts.mean(axis=0).tolist()})
    return output

for o in meshes:
    me=o.data;me.calc_loop_triangles()
    co=np.empty(len(me.vertices)*3,dtype=np.float32);me.vertices.foreach_get('co',co);co=co.reshape(-1,3)
    ed=np.empty(len(me.edges)*2,dtype=np.int32);me.edges.foreach_get('vertices',ed);ed=ed.reshape(-1,2)
    raw=components(co,ed)
    welded=components(co,ed,True)
    # Local Blender coordinates here are Z-up, front -Y.
    entry={'object':o.name,'vertices':len(me.vertices),'edges':len(me.edges),'polygons':len(me.polygons),'triangles':len(me.loop_triangles),'uv_layers':[x.name for x in me.uv_layers],'materials':[m.name for m in me.materials],'bounds_blender':{'min':co.min(axis=0).tolist(),'max':co.max(axis=0).tolist()},'raw_connected_component_count':len(raw),'raw_connected_components':raw[:100],'position_weld_tolerance':1e-6,'position_welded_component_count':len(welded),'position_welded_components':welded[:100]}
    report['meshes'].append(entry)
with open(os.path.join(OUT,'source-blender-inspection.json'),'w') as f:json.dump(report,f,ensure_ascii=False,indent=2)
print('SOURCE_TOPOLOGY',[(m['triangles'],m['raw_connected_component_count'],m['position_welded_component_count']) for m in report['meshes']])
# Scale only an inspection parent for identical useful studio framing.
root=bpy.data.objects.new('Inspection framing only',None);bpy.context.collection.objects.link(root)
for o in meshes:
    world=o.matrix_world.copy();o.parent=root;o.matrix_world=world
bpy.context.view_layer.update()
coords=[o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo=min(p.z for p in coords);hi=max(p.z for p in coords)
root.scale=(3.6/(hi-lo),)*3;root.location.z=-lo*root.scale.z
bpy.context.view_layer.update()

def area(name,location,power,size,target=(0,0,1.8)):
    light=bpy.data.lights.new(name,'AREA');light.energy=power;light.shape='DISK';light.size=size
    o=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(o);o.location=location
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Inspection key',(-3.5,-4.5,6),430,4)
area('Inspection fill',(4,-3,3.2),230,3.5)
area('Inspection rim',(1.5,2.5,4.8),510,3)
world=bpy.data.worlds.new('Inspection studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.34,.32,.30,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.5;bpy.context.scene.world=world
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1100;scene.render.resolution_y=1300;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'

def render(name,location,target=(0,0,1.8),scale=4.2):
    cam.location=location;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
    scene.render.filepath=os.path.join(OUT,name+'.png');bpy.ops.render.render(write_still=True)
render('source-front',(10,0,2.3))
render('source-back',(-10,0,2.3))
render('source-side',(0,-10,2.3))
render('source-three-quarter',(10,-3.6,3.4))
render('source-head-top',(4.6,-2.2,7.0),(0,0,2.86),2.6)
print('SOURCE_INSPECTION_COMPLETE')
