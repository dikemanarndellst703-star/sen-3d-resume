"""Refine the user's actual Tripo hamster mesh; preserve the seated source silhouette.

Default input is the byte-identical archived ai-hamster.glb. No V3 generator is used.
Blender: +Z up. Source front +X; output front -Y -> glTF +Z.
"""
import bpy,bmesh,math,os,json,hashlib,sys,shutil
import numpy as np
from mathutils import Vector,noise,kdtree
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(line_buffering=True)
sys.dont_write_bytecode=True
OUT=os.path.join(ROOT,'docs','redesign-v4-clay-2026-09-08')
FINAL=os.environ.get('CLAY_FINAL','1')=='1'
DRAFT=os.path.join(OUT,'renders' if FINAL else 'draft');os.makedirs(DRAFT,exist_ok=True)
sys.path.insert(0,os.path.join(ROOT,'blender'))
SOURCE=os.environ.get('CLAY_SOURCE',os.path.join(ROOT,'web','public','models','ai-hamster.glb'))
assert hashlib.sha256(open(SOURCE,'rb').read()).hexdigest()=='f196abdedb71ff60ed22014b88551f9f4c4f244b3b53d0de821f667bae4ec94c'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=SOURCE)
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH');obj.name='Source-derived seated clay hamster'
mesh=obj.data

def srgb(hex):
    v=[int(hex[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v)
def material(name,color,roughness=.85):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*srgb(color),1)
    p.inputs['Roughness'].default_value=roughness;p.inputs['Specular IOR Level'].default_value=.22
    m.diffuse_color=(*srgb(color),1);return m
capmat=material('Draft repaired crown · warm ochre clay','D6B985')
obj.data.materials.append(capmat);cap_index=len(obj.data.materials)-1

def ss(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
# Read the source atlas into vertex samples for semantic connectivity analysis.
# The two ear interiors are separate red components and remain protected.
coords=np.empty(len(mesh.vertices)*3,np.float32);mesh.vertices.foreach_get('co',coords);coords=coords.reshape(-1,3)
normal=np.empty(len(mesh.vertices)*3,np.float32);mesh.vertices.foreach_get('normal',normal);normal=normal.reshape(-1,3)
uv=np.empty(len(mesh.loops)*2,np.float32);mesh.uv_layers[0].data.foreach_get('uv',uv);uv=uv.reshape(-1,2)
vi=np.empty(len(mesh.loops),np.int32);mesh.loops.foreach_get('vertex_index',vi)
image=next(i for i in bpy.data.images if i.name not in ['Render Result','Viewer Node'])
w,h=image.size;pixels=np.empty(w*h*4,np.float32);image.pixels.foreach_get(pixels);pixels=pixels.reshape(h,w,4)
xy=np.floor(uv*np.array([w-1,h-1])).astype(int);samples=pixels[xy[:,1],xy[:,0],:3]
colors=np.zeros((len(coords),3),np.float32);counts=np.zeros(len(coords),np.float32)
np.add.at(colors,vi,samples);np.add.at(counts,vi,1);colors/=np.maximum(counts,1)[:,None]
red=(colors[:,0]>colors[:,1]*1.5)&(colors[:,0]>colors[:,2]*1.7)&(colors[:,0]>.12)&(coords[:,2]>.69)
edge=np.empty(len(mesh.edges)*2,np.int32);mesh.edges.foreach_get('vertices',edge);edge=edge.reshape(-1,2)
parents=list(range(len(coords)))
def find(i):
    while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
    return i
def union(a,b):
    a=find(a);b=find(b)
    if a!=b:parents[b]=a
positions={}
for i in np.flatnonzero(red):
    key=tuple(coords[i])
    if key in positions:union(int(i),positions[key])
    else:positions[key]=int(i)
for a,b in edge:
    if red[a] and red[b]:union(int(a),int(b))
from collections import defaultdict,deque
groups=defaultdict(list)
for i in np.flatnonzero(red):groups[find(int(i))].append(int(i))
regions=sorted(groups.values(),key=len,reverse=True)
crayfish_ids=regions[0]
seed_keys={tuple(coords[i]) for i in crayfish_ids}
# Fit a quadratic crown to intact, upward-facing gold head samples.
fit=(coords[:,2]>.64)&(coords[:,2]<.773)&(np.abs(coords[:,1])<.151)&(normal[:,2]>.35)&(~red)
fp=coords[fit]
def basis(x,y):return np.column_stack([np.ones_like(x),x,y,x*x,x*y,y*y])
A=basis(fp[:,0],fp[:,1]);z=fp[:,2]
weights=np.ones(len(fp))
for _ in range(6):
    coeff=np.linalg.lstsq(A*weights[:,None],z*weights,rcond=None)[0]
    residual=np.abs(A@coeff-z);weights=np.clip(.006/np.maximum(residual,.0001),.05,1)
print('CROWN_FIT',coeff.tolist(),'samples',len(fp))
def fitted_crown(x,y):
    return float(np.dot([1,x,y,x*x,x*y,y*y],coeff))

bm=bmesh.new();bm.from_mesh(mesh)
original={'vertices':len(bm.verts),'faces':len(bm.faces)}
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
remove={v for v in bm.verts if tuple(v.co) in seed_keys or v.co.z>.816}
# Expand only a very small rim; keep the ear cup volume protected.
for _ in range(3):
    more=set(remove)
    for v in remove:
        for e in v.link_edges:
            n=e.other_vert(v)
            protect=abs(n.co.y)>.15 and n.co.x<.205 and n.co.z<.816
            if not protect and n.co.z>.675:more.add(n)
    remove=more
bmesh.ops.delete(bm,geom=list(remove),context='VERTS')
# Black eyes/antenna islands left inside the removed red surface are detached.
remaining=set(bm.verts);components=[]
while remaining:
    start=remaining.pop();component={start};stack=[start]
    while stack:
        v=stack.pop()
        for e in v.link_edges:
            n=e.other_vert(v)
            if n in remaining:remaining.remove(n);component.add(n);stack.append(n)
    components.append(component)
components.sort(key=len,reverse=True)
if len(components)>1:bmesh.ops.delete(bm,geom=list(set().union(*components[1:])),context='VERTS')
# Construct a curved cap from every connected cut boundary. The source has
# tiny branched scan seams, so a plain holes_fill can silently miss the large hole.
wire=[v for v in bm.verts if not v.link_faces]
if wire:bmesh.ops.delete(bm,geom=wire,context='VERTS')
cut_edges={e for e in bm.edges if e.is_boundary}
edge_components=[]
while cut_edges:
    first=cut_edges.pop();component={first};stack=[first]
    while stack:
        edge=stack.pop()
        for v in edge.verts:
            for e in v.link_edges:
                if e in cut_edges:cut_edges.remove(e);component.add(e);stack.append(e)
    edge_components.append(component)
capfaces=[]
for edges in edge_components:
    verts={v for e in edges for v in e.verts}
    center=sum((v.co for v in verts),Vector())/len(verts)
    if center.z>.66:center.z=fitted_crown(center.x,center.y)
    mid=bm.verts.new(center)
    for e in edges:
        if not e.link_faces:continue
        loop=next(l for l in e.link_faces[0].loops if l.edge==e)
        try:f=bm.faces.new((loop.link_loop_next.vert,loop.vert,mid))
        except ValueError:continue
        f.material_index=cap_index;capfaces.append(f)
capedges=list({e for f in capfaces for e in f.edges})
if capedges:bmesh.ops.subdivide_edges(bm,edges=capedges,cuts=5,use_grid_fill=True)
for v in bm.verts:
    if v.link_faces and all(f.material_index==cap_index for f in v.link_faces) and v.co.z>.66:
        v.co.z=fitted_crown(v.co.x,v.co.y)

bm.normal_update();open_edges=sum(e.is_boundary for e in bm.edges)
bm.to_mesh(mesh);bm.free();mesh.update()
for p in mesh.polygons:p.use_smooth=True
# Union/remesh the connected repaired surface itself. This closes scan seams
# and relaxes the radial patch topology; no cover object is layered on the head.
obj.data.materials.clear();obj.data.materials.append(material('Geometry inspection · untextured clay','C0AA8B'))
bpy.context.view_layer.objects.active=obj
obj.select_set(True)
remesh=obj.modifiers.new('Continuous repaired source topology','REMESH')
remesh.mode='VOXEL';remesh.voxel_size=.00232 if FINAL else .0028;remesh.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=remesh.name)
mesh=obj.data
relax=obj.modifiers.new('Gentle scan cleanup','SMOOTH');relax.factor=.55;relax.iterations=3
bpy.ops.object.modifier_apply(modifier=relax.name)
group=obj.vertex_groups.new(name='Repaired crown relaxation')
for v in mesh.vertices:
    x,y,z=v.co
    weight=ss(.675,.74,z)*(1-ss(.13,.175,abs(y)))*ss(.015,.06,x)*(1-ss(.25,.305,x))
    if weight>0:group.add([v.index],weight,'REPLACE')
relax=obj.modifiers.new('Blend crown repair into source','SMOOTH');relax.factor=.7;relax.iterations=46 if FINAL else 18;relax.vertex_group=group.name
bpy.ops.object.modifier_apply(modifier=relax.name)
if FINAL:
    # Clean low-frequency reconstruction waves without rounding away anatomy.
    soft=obj.vertex_groups.new(name='Broad clay surfaces · fingers and features protected')
    for v in mesh.vertices:
        x,y,z=v.co;ay=abs(y)
        back=(1-ss(.06,.19,x))*ss(.12,.20,z)*(1-ss(.70,.76,z))
        belly=ss(.17,.23,x)*(1-ss(.092,.14,ay))*ss(.03,.075,z)*(1-ss(.28,.34,z))
        hand=math.exp(-((ay-.115)/.040)**4-((z-.219)/.057)**4)*ss(.265,.320,x)
        belly*=1-hand
        chin=ss(.20,.27,x)*(1-ss(.18,.245,ay))*ss(.326,.35,z)*(1-ss(.399,.429,z))
        strength=max(back,belly,chin)
        if strength>0:soft.add([v.index],strength,'REPLACE')
    mod=obj.modifiers.new('Remove low-frequency scan waves','SMOOTH');mod.factor=.66;mod.iterations=240;mod.vertex_group=soft.name
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mesh.update()
    from clay_color_regions_v4 import classify,PALETTE_LINEAR,PBR
    names=[n for n in PALETTE_LINEAR if n!='clay_bag'];name_ids={name:i for i,name in enumerate(names)}
    tree=kdtree.KDTree(len(coords))
    for i,co in enumerate(coords):tree.insert(co,i)
    tree.balance()
    labels=np.empty(len(mesh.vertices),np.int16)
    for v in mesh.vertices:
        nearest,index,distance=tree.find(v.co)
        name,_=classify(coords[index],colors[index]);labels[v.index]=name_ids[name]
    # Local label majority removes isolated atlas lighting speckles; it never
    # blurs the 2D atlas across unrelated UV islands.
    edges=np.empty(len(mesh.edges)*2,np.int32);mesh.edges.foreach_get('vertices',edges);edges=edges.reshape(-1,2)
    for _ in range(5):
        votes=np.zeros((len(mesh.vertices),len(names)),np.float32)
        for i in range(len(names)):
            votes[:,i]=np.bincount(edges[:,0],weights=(labels[edges[:,1]]==i),minlength=len(labels))+np.bincount(edges[:,1],weights=(labels[edges[:,0]]==i),minlength=len(labels))
        votes[np.arange(len(labels)),labels]+=3
        labels=np.argmax(votes,axis=1).astype(np.int16)
    degree=np.bincount(edges.ravel(),minlength=len(labels))
    # Close small semantic holes caused by baked highlights within a clay part.
    # All operations follow mesh adjacency, not a texture island's 2D neighbors.
    for name in ['clay_frame','clay_eye','clay_nose_mouth','clay_blush','clay_pink']:
        i=name_ids[name];mask=labels==i
        for _ in range(8):
            count=np.bincount(edges[:,0],weights=mask[edges[:,1]],minlength=len(labels))+np.bincount(edges[:,1],weights=mask[edges[:,0]],minlength=len(labels))
            mask|=count>0
        for _ in range(8):
            count=np.bincount(edges[:,0],weights=mask[edges[:,1]],minlength=len(labels))+np.bincount(edges[:,1],weights=mask[edges[:,0]],minlength=len(labels))
            mask&=count==degree
        labels[mask]=i
    palette=np.array([PALETTE_LINEAR[name] for name in names])
    attr=mesh.color_attributes.new(name='ClayColor',type='BYTE_COLOR',domain='POINT')
    rgba=np.ones((len(labels),4),np.float32);rgba[:,:3]=palette[labels]
    for _ in range(5):
        for axis in range(3):
            values=rgba[:,axis]
            total=np.bincount(edges[:,0],weights=values[edges[:,1]],minlength=len(labels))+np.bincount(edges[:,1],weights=values[edges[:,0]],minlength=len(labels))
            rgba[:,axis]=(total+2*values)/(degree+2)
    attr.data.foreach_set('color',rgba.ravel())
    mesh.materials.clear()
    for name in names:
        m=material(name,'FFFFFF',PBR[name]['roughness']);pbr=m.node_tree.nodes.get('Principled BSDF')
        pbr.inputs['IOR'].default_value=1.45;pbr.inputs['Coat Weight'].default_value=0;pbr.inputs['Specular IOR Level'].default_value=.25
        vcol=m.node_tree.nodes.new('ShaderNodeVertexColor');vcol.layer_name='ClayColor';m.node_tree.links.new(vcol.outputs['Color'],pbr.inputs['Base Color'])
        mesh.materials.append(m)
    for face in mesh.polygons:
        face.material_index=int(np.bincount(labels[list(face.vertices)],minlength=len(names)).argmax())
    # Real micro-geometry: shallow, non-periodic clay grain and sparse tool drags.
    # Metallic/glass shine and V3 plush fibres are deliberately absent.
    clay_positions=np.empty(len(mesh.vertices)*3,np.float32);mesh.vertices.foreach_get('co',clay_positions);clay_positions=clay_positions.reshape(-1,3)
    clay_normals=np.empty(len(mesh.vertices)*3,np.float32);mesh.vertices.foreach_get('normal',clay_normals);clay_normals=clay_normals.reshape(-1,3)
    for v in mesh.vertices:
        x,y,z=clay_positions[v.index];name=names[labels[v.index]]
        amplitude=.22 if name in ['clay_frame','clay_eye','clay_nose_mouth'] else 1.0
        grain=noise.noise(Vector((x*155,y*155,z*155)),noise_basis='PERLIN_NEW')
        drag=math.sin(z*102+y*27+noise.noise(Vector((x*24,y*24,z*24)))*3)*math.sin(x*91-y*49)
        offset=amplitude*(.00014*grain+.000055*drag)
        clay_positions[v.index]+=clay_normals[v.index]*offset
    mesh.vertices.foreach_set('co',clay_positions.ravel())
    mesh.update()
    from clay_backpack_v4 import build_backpack
    bag=build_backpack(material,obj)
    bag_triangles=0
    for part in bag.children:
        part.data.calc_loop_triangles();bag_triangles+=len(part.data.loop_triangles)
    mesh.calc_loop_triangles();pre_budget_triangles=len(mesh.loop_triangles)
    target_body=1025000-bag_triangles
    assert pre_budget_triangles>=target_body, 'Increase authored remesh resolution to meet actual million-face requirement'
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    budget=obj.modifiers.new('Measured final million-face budget','DECIMATE');budget.ratio=target_body/pre_budget_triangles;budget.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=budget.name)
    mesh=obj.data
    region_counts={name:int((labels==i).sum()) for i,name in enumerate(names)}
else:
    bag=None;bag_triangles=0;region_counts={}
for p in mesh.polygons:p.use_smooth=True
check=bmesh.new();check.from_mesh(mesh);open_edges=sum(e.is_boundary for e in check.edges);nonmanifold_edges=sum(not e.is_manifold for e in check.edges);check.free()
mesh.calc_loop_triangles()

rig=bpy.data.objects.new('HamsterRoot',None);bpy.context.collection.objects.link(rig)
world=obj.matrix_world.copy();obj.parent=rig;obj.matrix_world=world
if bag is not None:bag.parent=rig
rig.rotation_euler.z=-math.pi/2
bpy.context.view_layer.update()
pts=[obj.matrix_world @ Vector(c) for c in obj.bound_box]
lo=min(p.z for p in pts);hi=max(p.z for p in pts)
rig.scale=(3.6/(hi-lo),)*3;rig.location.z=-lo*rig.scale.z
bpy.context.view_layer.update()

character=[o for o in bpy.context.scene.objects if o.type in ['MESH','EMPTY']]
report={'source_file':'web/public/models/ai-hamster.glb','uploaded_filename':'tripo_convert_bfa920ab-ad7b-44e1-b2ac-2ceb65744036.glb','source_sha256':hashlib.sha256(open(SOURCE,'rb').read()).hexdigest(),'source_preserved':True,'source_original':original,'open_edges_after_repair':open_edges,'nonmanifold_edges_after_repair':nonmanifold_edges,'method':'Original source mesh, red-texture connected component seed, protected ear volumes, crown fit from original gold surface, continuous remesh, spatially protected smoothing','draft_only':not FINAL,'color_region_vertices_before_budget':region_counts,'independent_backpack':bool(bag),'runtime_nodes':['HamsterRoot','ClayBackpack'] if FINAL else ['HamsterRoot'],'animation_contract':'whole-character rotation; no fabricated separate head, eye or arm nodes','front':{'blender':'-Y','gltf':'+Z'},'up':{'blender':'+Z','gltf':'+Y'},'body_height':3.6,'textures':0 if FINAL else 0}
if not FINAL:
    bpy.ops.object.select_all(action='DESELECT')
    for item in character:item.select_set(True)
    bpy.context.view_layer.objects.active=obj
    bpy.ops.export_scene.gltf(filepath=os.path.join(DRAFT,'hamster-no-crayfish-draft.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
    report.update(draft_vertices=len(mesh.vertices),draft_polygons=len(mesh.polygons),draft_triangles=len(mesh.loop_triangles))
    with open(os.path.join(DRAFT,'surgery-stats.json'),'w') as f:json.dump(report,f,ensure_ascii=False,indent=2)


def area(name,loc,energy,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc
    o.rotation_euler=(Vector((0,0,1.8))-o.location).to_track_quat('-Z','Y').to_euler()
area('Neutral key',(-3.5,-4.5,6),430,4)
area('Neutral fill',(4,-3,3.2),230,3.5)
area('Neutral rim',(1.5,2.5,4.8),510,3)
w=bpy.data.worlds.new('Neutral inspection studio');w.use_nodes=True
w.node_tree.nodes['Background'].inputs[0].default_value=(.34,.32,.30,1);w.node_tree.nodes['Background'].inputs[1].default_value=.5
bpy.context.scene.world=w
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=40 if FINAL else 24;scene.cycles.use_denoising=True
scene.render.resolution_x=1400 if FINAL else 1100;scene.render.resolution_y=1600 if FINAL else 1300;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'

def render(name,loc,target=(0,0,1.8),scale=4.3):
    cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
    scene.render.filepath=os.path.join(DRAFT,name+'.png');bpy.ops.render.render(write_still=True)
bpy.context.preferences.filepaths.save_version=0
if FINAL:
    authoring_polygons=sum(len(item.data.polygons) for item in character if item.type=='MESH')
    authoring_triangles=0
    for item in character:
        if item.type=='MESH':item.data.calc_loop_triangles();authoring_triangles+=len(item.data.loop_triangles)
    cam.location=(3.6,-10,3.4);cam.rotation_euler=(Vector((0,0,1.8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=4.3
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','hamster-v4-clay-authoring.blend'),compress=True)
    for item in character:
        if item.type!='MESH':continue
        bpy.ops.object.select_all(action='DESELECT');item.select_set(True);bpy.context.view_layer.objects.active=item
        mod=item.modifiers.new('Applied triangulation for exact Blender face count','TRIANGULATE');mod.quad_method='SHORTEST_DIAGONAL';bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.select_all(action='DESELECT')
    for item in character:item.select_set(True)
    bpy.context.view_layer.objects.active=obj
    glb=os.path.join(ROOT,'web','public','models','hamster-v4-clay.glb')
    bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','hamster-v4-clay.blend'),compress=True)
    triangles=sum(len(item.data.polygons) for item in character if item.type=='MESH')
    mesh_rows=[{'name':item.name,'vertices':len(item.data.vertices),'polygons':len(item.data.polygons),'materials':[mat.name for mat in item.data.materials]} for item in character if item.type=='MESH']
    report.update(mesh_count=len(mesh_rows),mesh_objects=mesh_rows,material_count=len({name for row in mesh_rows for name in row['materials']}),body_triangles=len(obj.data.polygons))
    bounds_points=[item.matrix_world @ Vector(c) for item in character if item.type=='MESH' for c in item.bound_box]
    report.update(triangles=triangles,blender_polygons=triangles,vertices=sum(len(item.data.vertices) for item in character if item.type=='MESH'),authoring_polygons=authoring_polygons,authoring_triangles=authoring_triangles,backpack_triangles=bag_triangles,glb_bytes=os.path.getsize(glb),glb_sha256=hashlib.sha256(open(glb,'rb').read()).hexdigest(),blender_version=bpy.app.version_string,blender_bounds={'min':[min(p[k] for p in bounds_points) for k in range(3)],'max':[max(p[k] for p in bounds_points) for k in range(3)]})
    assert 1000000<=triangles<=1050000,f'Final actual triangle count outside requirement: {triangles}'
    assert os.path.getsize(glb)<50*1024*1024
    os.makedirs(os.path.join(OUT,'stats'),exist_ok=True)
    with open(os.path.join(OUT,'stats','model-stats.json'),'w') as f:json.dump(report,f,ensure_ascii=False,indent=2)
    with open(os.path.join(OUT,'model-stats.json'),'w') as f:json.dump(report,f,ensure_ascii=False,indent=2)
    print('FINAL_MODEL_STATS',json.dumps(report))
    render('model-front',(0,-10,2.3))
    render('model-back',(0,10,2.3))
    render('model-side',(10,0,2.3))
    render('model-three-quarter',(3.6,-10,3.4))
    shutil.copy2(scene.render.filepath,os.path.join(ROOT,'web','public','brand','hamster-v4-clay-poster.png'))
    render('model-detail',(2.0,-6,4.5),(0,-.15,2.55),3.55)
    render('model-head-top',(2.0,-5,7),(0,-.2,2.7),3.65)
    render('model-backpack-detail',(1.8,7,3.3),(0,.55,1.77),3.05)
    os.makedirs(os.path.join(OUT,'after'),exist_ok=True)
    for name in ['model-front.png','model-back.png','model-detail.png']:
        shutil.copy2(os.path.join(DRAFT,name),os.path.join(OUT,'after',name))
    print('CLAY_V4_COMPLETE')
else:
    render('surgery-front',(0,-10,2.3))
    render('surgery-back',(0,10,2.3))
    render('surgery-side',(10,0,2.3))
    render('surgery-three-quarter',(3.6,-10,3.4))
    render('surgery-head-top',(2.0,-5,7),(0,-.2,2.7),3.65)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DRAFT,'source-surgery.blend'),compress=True)
    print('DRAFT_SURGERY_COMPLETE')
