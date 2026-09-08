"""Reproducible, original Blender model for AI 仓鼠洞 V2.

Run with Blender 5.x:
  blender --background --python blender/build_hamster_v2.py

All geometry is authored here. No previous mesh or external textures are used.
Blender front = -Y; glTF front = +Z. All dimensions are in scene units.
"""
import bpy
import math
import json
import os
from mathutils import Vector
from math import sin, cos, pi, sqrt, exp

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'redesign-2026-09-08')
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(ROOT, 'web', 'public', 'models'), exist_ok=True)
os.makedirs(os.path.join(ROOT, 'web', 'public', 'brand'), exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for block in list(bpy.data.materials):
    bpy.data.materials.remove(block)

def rgb(h):
    h = h.lstrip('#')
    values = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values)

def mat(name, color, roughness=.5, metallic=0, vertex=False, subsurface=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*rgb(color), 1)
    b.inputs['Roughness'].default_value = roughness
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Subsurface Weight'].default_value = subsurface
    b.inputs['Coat Weight'].default_value = .08 if roughness > .3 else .22
    b.inputs['Coat Roughness'].default_value = .28
    if vertex:
        attr = m.node_tree.nodes.new('ShaderNodeVertexColor')
        attr.layer_name = 'Color'
        m.node_tree.links.new(attr.outputs['Color'], b.inputs['Base Color'])
    m.diffuse_color = (*rgb(color), 1)
    return m

SKIN = mat('Clay · warm golden coat & cream vertex colour', '#D5AF77', .62, vertex=True, subsurface=.025)
INK = mat('Eyewear · softened charcoal acetate', '#272521', .33)
EYE = mat('Eyes · polished dark chocolate', '#211914', .105)
MOUTH = mat('Nose and smile · cocoa clay', '#735545', .55)
CREAM = mat('Details · warm ivory', '#FFF2D8', .58)
HIGHLIGHT = mat('Eyes · reflected softbox', '#FFFFFF', .15)
PINK = mat('Paws and ear inner · muted rose', '#DF9C91', .63, subsurface=.03)
BRASS = mat('Hardware · brushed champagne', '#C8AC79', .29, metallic=.7)
STRAP = mat('Backpack · cocoa canvas', '#695845', .73)
CORAL = mat('Learning badge · coral enamel', '#D9624F', .35)
WHISKER = mat('Whiskers · dark oat', '#9F815A', .6)
COAT = rgb('#D5AF77')
CHEEK = rgb('#F7E5BF')
BLUSH = rgb('#DF9C91')

def mix(a, b, t):
    t = max(0, min(1, t))
    return tuple(a[i]*(1-t)+b[i]*t for i in range(3))

def smooth(a, b, x):
    t = max(0, min(1, (x-a)/(b-a)))
    return t*t*(3-2*t)

def parent(obj, p):
    world = obj.matrix_world.copy()
    obj.parent = p
    obj.matrix_world = world
    return obj

def empty(name, location, p=None):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.location = location
    bpy.context.view_layer.update()
    if p: parent(o, p)
    return o

RIG = empty('HamsterRoot', (0,0,0))
HEAD = empty('Head', (0,0,1.98), RIG)
ARML = empty('Arm_L', (.71,.005,1.66), RIG)
ARMR = empty('Arm_R', (-.71,.005,1.66), RIG)

def mesh(name, verts, faces, material, p=None, colors=None):
    me = bpy.data.meshes.new(name + ' · mesh')
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    for face in me.polygons: face.use_smooth = True
    if colors is not None:
        ca = me.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='POINT')
        for d,c in zip(ca.data, colors): d.color = (*c,1)
    if p: parent(o,p)
    return o

def spow(x, a):
    return math.copysign(abs(x)**a, x)

def ellipsoid(name, loc, scale, material, p=None, segments=48, rings=32, power=1., deform=None, colour=None):
    verts=[]; colors=[]; faces=[]
    # Small pole rings avoid the degenerate quads of a normal UV sphere.
    for i in range(rings+1):
        t=pi*(.0001+(1-.0002)*i/rings)
        for j in range(segments):
            a=2*pi*j/segments
            x=spow(sin(t)*cos(a),power)*scale[0]
            y=spow(sin(t)*sin(a),power)*scale[1]
            z=spow(cos(t),power)*scale[2]
            if deform: x,y,z=deform(x,y,z)
            point=(loc[0]+x,loc[1]+y,loc[2]+z)
            verts.append(point)
            if material==SKIN:
                colors.append(colour(point) if colour else COAT)
    for i in range(rings):
        for j in range(segments):
            a=i*segments+j;b=i*segments+(j+1)%segments
            faces.append((a,a+segments,b+segments,b))
    faces.extend([tuple(range(segments)),tuple(reversed([rings*segments+j for j in range(segments)]))])
    return mesh(name, verts, faces, material, p, colors if colors else None)

def tube(name, points, radii, material, p=None, sides=10, colors=None, squash=1, closed=False):
    verts=[];faces=[];cdata=[]
    if closed and Vector(points[0]) == Vector(points[-1]):points=points[:-1]
    for i,point in enumerate(points):
        a=Vector(points[(i-1)%len(points)] if closed else points[max(0,i-1)])
        b=Vector(points[(i+1)%len(points)] if closed else points[min(len(points)-1,i+1)])
        tangent=(b-a).normalized()
        axis=Vector((0,1,0))
        if abs(tangent.dot(axis))>.94:axis=Vector((1,0,0))
        u=tangent.cross(axis).normalized();v=tangent.cross(u).normalized()
        r=radii[i] if isinstance(radii,list) else radii
        for j in range(sides):
            angle=2*pi*j/sides
            q=Vector(point)+r*(cos(angle)*u+sin(angle)*v*squash)
            verts.append(q)
            if material==SKIN:cdata.append(colors[i] if colors else COAT)
    for i in range(len(points) if closed else len(points)-1):
        for j in range(sides):
            a=i*sides+j;b=i*sides+(j+1)%sides
            faces.append((a,b,(b+sides)%len(verts),(a+sides)%len(verts)))
    if not closed:faces += [tuple(reversed(range(sides))),tuple((len(points)-1)*sides+j for j in range(sides))]
    return mesh(name,verts,faces,material,p,cdata if cdata else None)

def bezier(control, count=32):
    p0,p1,p2,p3=map(Vector,control)
    return [tuple((1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t*t*p2+t**3*p3) for t in [i/(count-1) for i in range(count)]]

def stroke(name, control, radius, material, p=HEAD, count=32, sides=10):
    pts=bezier(control,count)
    radii=[radius*(.5+.5*max(0,sin(pi*i/(count-1)))**.18) for i in range(count)]
    return tube(name,pts,radii,material,p,sides)

def head_deform(x,y,z):
    # More volume at the cheeks, taper towards the crown, and a soft flat face.
    x*=1+.065*exp(-((z+.28)/.35)**2)-.035*smooth(.38,.82,z)
    if y<0:
        front=smooth(0,.45,-y)
        eye_dent=.055*(exp(-((x-.40)/.24)**2-((z-.14)/.23)**2)+exp(-((x+.40)/.24)**2-((z-.14)/.23)**2))
        muzzle=.095*exp(-(x/.41)**4-((z+.28)/.22)**2)
        cheeks=.027*exp(-((abs(x)-.62)/.23)**2-((z+.25)/.30)**2)
        y+=front*(eye_dent-muzzle-cheeks)
    return x,y,z

def head_color(v):
    x,y,z=v
    front=smooth(.15,.47,-y)
    edge=2.42+.095*(abs(x)/1.05)**1.4
    cream=(1-smooth(edge-.035,edge+.055,z))*front
    c=mix(COAT,CHEEK,cream)
    blush=exp(-((abs(x)-.73)/.165)**4-((z-2.29)/.14)**4)*front*.83
    c=mix(c,BLUSH,blush)
    variation=1+.012*sin(x*43+z*29)*sin(y*31-z*17)
    return tuple(min(1,ch*variation) for ch in c)

head=ellipsoid('Sculpted head · full cheeks & recessed eyes',(0,0,2.55),(1.05,.69,.81),SKIN,HEAD,96,64,.88,head_deform,head_color)

def body_deform(x,y,z):
    x*=1+.12*exp(-((z+.3)/.45)**2)-.15*smooth(.2,.88,z)
    z+=.04*(1-exp(-(x/.22)**2))*(1-smooth(-.85,-.65,z))
    return x,y,z

def body_color(v):
    x,y,z=v
    oval=(x/.51)**2+((z-1.02)/.68)**2
    cream=(1-smooth(.76,1.18,oval))*smooth(.16,.42,-y)
    return mix(COAT,CHEEK,cream)

body=ellipsoid('Sculpted pear body · cream belly',(0,.07,1.09),(.76,.57,.94),SKIN,RIG,80,52,.9,body_deform,body_color)

# Ears are continuous cupped volumes with inset pink bowls and a rolled edge.
for side, suffix in [(1,'L'),(-1,'R')]:
    ex=side*.80;ez=3.25
    ellipsoid('Ear '+suffix+' · golden outer cup',(ex,.01,ez),(.325,.165,.34),SKIN,HEAD,48,32,.91)
    ellipsoid('Ear '+suffix+' · recessed pink bowl',(ex,-.148,ez+.005),(.222,.038,.241),PINK,HEAD,48,28,.94)
    # Inner ear small sculpted lower fold.
    stroke('Ear '+suffix+' · fold',[(ex-side*.14,-.179,ez-.115),(ex-side*.08,-.20,ez-.18),(ex+side*.05,-.19,ez-.19),(ex+side*.12,-.17,ez-.15)],.013,PINK,HEAD,20,8)

# Eyes sit inside shallow sculpted sockets. The origin is the eyeball centre.
for side,suffix in [(1,'L'),(-1,'R')]:
    eye=ellipsoid('Eye_'+suffix,(side*.39,-.684,2.68),(.083,.070,.111),EYE,None,40,28)
    eye_origin=Vector((side*.39,-.684,2.68))
    for vertex in eye.data.vertices:vertex.co-=eye_origin
    eye.location=eye_origin
    bpy.context.view_layer.update();parent(eye,HEAD)
    glint=ellipsoid('Eye '+suffix+' · main catchlight',(side*.39-.022,-.747,2.72),(.020,.009,.022),HIGHLIGHT,eye,20,12)
    glint2=ellipsoid('Eye '+suffix+' · small catchlight',(side*.39+.023,-.749,2.65),(.008,.004,.009),HIGHLIGHT,eye,16,10)

# Glasses are a real tubular rounded rectangle, with bevels and temple arms.
def glasses_loop(cx,cz,width=.735,height=.545,corner=.17):
    pts=[]
    for ox,oz,start in [(width/2-corner,height/2-corner,0),(-width/2+corner,height/2-corner,90),(-width/2+corner,-height/2+corner,180),(width/2-corner,-height/2+corner,270)]:
        for i in range(24):
            a=(start+i/23*90)*pi/180
            # Start at right upper corner and travel around anticlockwise.
            xx=cx+ox+corner*cos(a);zz=cz+oz+corner*sin(a)
            yy=-.813+.07*(abs(xx)/.90)**2
            pts.append((xx,yy,zz))
    pts.append(pts[0])
    return pts

# Correct corner order: each quarter is traversed continuously.
for side,suffix in [(1,'L'),(-1,'R')]:
    pts=glasses_loop(side*.44,2.70)
    tube('Glasses '+suffix+' · rounded acetate frame',pts,.057,INK,HEAD,12,squash=.84,closed=True)
    stroke('Glasses '+suffix+' · temple',[(side*.825,-.752,2.78),(side*.99,-.66,2.86),(side*1.04,-.13,2.80),(side*.98,.08,2.64)],.044,INK,HEAD,40,12)
    ellipsoid('Glasses '+suffix+' · hinge',(side*.838,-.770,2.781),(.028,.015,.023),BRASS,HEAD,20,12)
stroke('Glasses · saddle bridge',[(-.075,-.82,2.72),(-.028,-.873,2.76),(.028,-.873,2.76),(.075,-.82,2.72)],.049,INK,HEAD,24,12)

# Nose is an original tapered heart/rounded triangle surface.
def nose_deform(x,y,z):
    x*=.64+.40*smooth(-.065,.055,z)
    z-=.011*exp(-(x/.028)**2)*smooth(0,.075,z)
    return x,y,z
ellipsoid('Nose · tiny soft heart',(0,-.822,2.386),(.128,.087,.079),MOUTH,HEAD,48,30,.95,nose_deform)
stroke('Philtrum',[(0,-.838,2.332),(0,-.855,2.31),(0,-.847,2.27),(0,-.831,2.259)],.019,MOUTH)
stroke('Smile L',[(0,-.833,2.274),(.035,-.846,2.18),(.158,-.807,2.182),(.199,-.779,2.266)],.022,MOUTH)
stroke('Smile R',[(0,-.833,2.274),(-.035,-.846,2.18),(-.158,-.807,2.182),(-.199,-.779,2.266)],.022,MOUTH)
for side in (1,-1):
    for k in range(2):
        zz=2.31-k*.07
        stroke('Whisker '+str(side)+' '+str(k),[(side*.70,-.63,zz),(side*.81,-.622,zz+.01),(side*.95,-.57,zz+.035-k*.045),(side*1.03,-.505,zz+.055-k*.08)],.009,WHISKER,HEAD,22,8)
    # Short subtle brows above the frame.
    stroke('Brow '+str(side),[(side*.24,-.566,3.042),(side*.33,-.616,3.074),(side*.48,-.59,3.077),(side*.56,-.545,3.05)],.019,SKIN,HEAD,28,8)

# Soft arms are swept, tapered meshes and retain shoulder pivots.
for side,suffix,arm in [(1,'L',ARML),(-1,'R',ARMR)]:
    controls=[(side*.72,.005,1.69),(side*.93,-.08,1.51),(side*.97,-.25,1.12),(side*.86,-.32,.92)]
    pts=bezier(controls,40)
    radii=[.012+.162*(sin(pi*i/39)**.35) for i in range(40)]
    colors=[mix(COAT,BLUSH,.22*smooth(.65,1,i/39)) for i in range(40)]
    tube('Arm '+suffix+' · tapered sculpt',pts,radii,SKIN,arm,24,colors,squash=.83)
    ellipsoid('Paw '+suffix+' · palm',(side*.866,-.342,.971),(.125,.10,.152),SKIN,arm,32,24,.94,colour=lambda p:mix(COAT,BLUSH,.35))
    for k in range(3):
        x=side*(.792+k*.067)
        ellipsoid('Paw '+suffix+' · finger '+str(k),(x,-.395,.929),(.042,.064,.078),SKIN,arm,24,16,.95,colour=lambda p:mix(COAT,BLUSH,.6))

# Feet: three articulated pink toes per foot, with subtle toenail pads.
for side,suffix in [(1,'L'),(-1,'R')]:
    ellipsoid('Foot '+suffix+' · soft pad',(side*.43,-.075,.151),(.233,.299,.151),PINK,RIG,40,26,.9)
    for k in range(3):
        x=side*.43+(k-1)*.119
        ellipsoid('Foot '+suffix+' · toe '+str(k),(x,-.296,.115),(.071,.130,.085),PINK,RIG,28,20,.95)
        ellipsoid('Foot '+suffix+' · nail '+str(k),(x,-.40,.129),(.032,.035,.012),CREAM,RIG,16,12)

# A discreet learning backpack gives the silhouette character from all sides.
ellipsoid('Backpack · padded shell',(0,.60,1.18),(.48,.21,.58),STRAP,RIG,48,36,.61)
ellipsoid('Backpack · pocket',(0,.795,1.02),(.33,.067,.26),STRAP,RIG,40,24,.65)
for side in (1,-1):
    stroke('Backpack shoulder strap '+str(side),[(side*.47,.61,1.69),(side*.63,.21,1.92),(side*.56,-.41,1.77),(side*.56,-.445,1.21)],.035,STRAP,RIG,40,10)
    ellipsoid('Backpack buckle '+str(side),(side*.56,-.471,1.49),(.056,.023,.074),BRASS,RIG,24,16,.55)
stroke('Backpack handle',[(-.14,.645,1.70),(-.14,.69,1.89),(.14,.69,1.89),(.14,.645,1.70)],.030,STRAP,RIG,32,10)
# Coral badge sits on the character's left shoulder strap, clear of belly.
ellipsoid('Learning badge · coral disc',(-.554,-.505,1.52),(.106,.025,.106),CORAL,RIG,40,24)
# Little ivory star motif as geometry; no font or texture dependency.
star=[]
for j in range(10):
    a=pi/2+2*pi*j/10;r=.058 if j%2==0 else .026
    star.append((-.554+r*cos(a),-.534,1.52+r*sin(a)))
mesh('Learning badge · star',star,[tuple(range(10))],CREAM,RIG)
ellipsoid('Tail · tiny rose nub',(0,.664,.48),(.115,.16,.13),PINK,RIG,32,22)

# Join non-moving meshes by pivot and material. The named eyes stay independent.
def merge_static():
    groups={}
    for o in list(bpy.context.scene.objects):
        if o.type!='MESH' or o.name in ('Eye_L','Eye_R'):continue
        if o.parent and o.parent.name in ('Eye_L','Eye_R'):continue
        key=(o.parent.name if o.parent else '',o.data.materials[0].name)
        groups.setdefault(key,[]).append(o)
    for (pn,mn),objects in groups.items():
        if len(objects)<2:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        objects[0].name=pn+' · '+mn.split(' · ')[0]

merge_static()
bpy.context.view_layer.update()
character=list(bpy.context.scene.objects)
deps=bpy.context.evaluated_depsgraph_get()
triangles=0;vertices=0
for o in character:
    if o.type=='MESH':
        o.data.calc_loop_triangles()
        triangles+=len(o.data.loop_triangles);vertices+=len(o.data.vertices)
coords=[o.matrix_world @ Vector(corner) for o in character if o.type=='MESH' for corner in o.bound_box]
bounds={'min':[min(p[k] for p in coords) for k in range(3)],'max':[max(p[k] for p in coords) for k in range(3)]}

bpy.ops.object.select_all(action='DESELECT')
for o in character:o.select_set(True)
bpy.context.view_layer.objects.active=RIG
glb=os.path.join(ROOT,'web','public','models','hamster-v2.glb')
bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)

# Product-photo studio is only in the editable .blend; never in the runtime GLB.
def area(name,location,power,size,color,target=(0,0,1.8)):
    light=bpy.data.lights.new(name,'AREA');light.energy=power;light.shape='DISK';light.size=size;light.color=color
    o=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(o);o.location=location
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o

area('Studio · key softbox',(-3.5,-4.5,6),430,4.0,(1,.90,.78))
area('Studio · warm fill',(4,-3,3.2),230,3.5,(1,.95,.86))
area('Studio · edge light',(1.5,2.5,4.8),510,3,(1,.87,.68))
area('Studio · frontal eye reflection',(-.3,-5,3.9),60,1.4,(1,1,1))
world=bpy.data.worlds.new('Studio · warm ambient')
world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.34,.29,.23,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.35
bpy.context.scene.world=world
bpy.ops.object.camera_add(location=(4.6,-9.5,4.3))
cam=bpy.context.object;cam.name='Studio · portrait camera'
target=Vector((0,0,1.81));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=4.4
bpy.context.scene.camera=cam
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=1600;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.render.filepath=os.path.join(ROOT,'web','public','brand','hamster-v2-poster.png')

# Set a useful editable viewport and select the character root.
bpy.ops.object.select_all(action='DESELECT');RIG.select_set(True);bpy.context.view_layer.objects.active=RIG
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.region_3d.view_distance=6
            a.spaces.active.region_3d.view_location=(0,0,1.8)

blend=os.path.join(ROOT,'blender','hamster-v2.blend')
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=blend)
stats={
    'name':'AI Hamster Guide V2','generated_at':'2026-09-08','blender_version':bpy.app.version_string,
    'source_script':'blender/build_hamster_v2.py','triangles':triangles,'vertices':vertices,
    'mesh_objects':sum(o.type=='MESH' for o in character),'materials':len({m.name for o in character if o.type=='MESH' for m in o.data.materials}),
    'glb_bytes':os.path.getsize(glb),'blender_bounds':bounds,'height':bounds['max'][2]-bounds['min'][2],
    'runtime_nodes':{name:list(bpy.data.objects[name].location) for name in ['HamsterRoot','Head','Eye_L','Eye_R','Arm_L','Arm_R']},
    'front':{'blender':'-Y','gltf':'+Z'},'up':{'blender':'+Z','gltf':'+Y'},
    'textures':0,'animations':'runtime-procedural; independent shoulder, head and eye pivots',
    'old_assets_preserved':True
}
with open(os.path.join(OUT,'model-stats.json'),'w') as f:json.dump(stats,f,ensure_ascii=False,indent=2)
print('MODEL_STATS',json.dumps(stats))
assert triangles<120000, 'Triangle budget exceeded'
assert os.path.getsize(glb)<8*1024*1024, 'Asset size budget exceeded'
bpy.ops.render.render(write_still=True)
import shutil
shutil.copy2(scene.render.filepath,os.path.join(OUT,'model-render.png'))
print('HAMSTER_V2_COMPLETE')
