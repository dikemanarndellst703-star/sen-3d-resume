"""Reproducible, original Blender model for AI 仓鼠洞 V3 · Million-triangle edition.

Run with Blender 5.x:
  blender --background --python blender/build_hamster_v3.py

All geometry is authored here. No previous mesh or external textures are used.
Blender front = -Y; glTF front = +Z. All dimensions are in scene units.
"""
import bpy
import math
import json
import os
from mathutils import Vector, noise
from math import sin, cos, pi, sqrt, exp
import random
import hashlib
random.seed(3908)
DRAFT = os.environ.get("HAMSTER_DRAFT", "0") == "1"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'redesign-v3-2026-09-08')
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(OUT, 'model-renders'), exist_ok=True)
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
    b.inputs['Coat Weight'].default_value = .025 if roughness > .65 else .20
    b.inputs['Coat Roughness'].default_value = .28
    if vertex:
        attr = m.node_tree.nodes.new('ShaderNodeVertexColor')
        attr.layer_name = 'Color'
        m.node_tree.links.new(attr.outputs['Color'], b.inputs['Base Color'])
    m.diffuse_color = (*rgb(color), 1)
    return m

SKIN = mat('Clay · warm golden coat & cream vertex colour', '#DAB077', .78, vertex=True, subsurface=.025)
INK = mat('Eyewear · softened charcoal acetate', '#252320', .24)
EYE = mat('Eyes · polished dark chocolate', '#211914', .105)
MOUTH = mat('Nose and smile · cocoa clay', '#735545', .55)
CREAM = mat('Details · warm ivory', '#FFF2D8', .58)
HIGHLIGHT = mat('Eyes · reflected softbox', '#FFFFFF', .15)
PINK = mat('Paws and ear inner · muted rose', '#E89280', .63, subsurface=.03)
BRASS = mat('Hardware · brushed champagne', '#C8AC79', .29, metallic=.7)
STRAP = mat('Backpack · cocoa canvas', '#695845', .73)
CORAL = mat('Learning badge · coral enamel', '#D9624F', .35)
WHISKER = mat('Whiskers · dark oat', '#9F815A', .6)
COAT = rgb('#DAB077')
CHEEK = rgb('#FFE8BE')
BLUSH = rgb('#E89280')

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
HEAD = empty('Head', (0,0,1.94), RIG)
ARML = empty('Arm_L', (.64,.005,1.60), RIG)
ARMR = empty('Arm_R', (-.64,.005,1.60), RIG)

def mesh(name, verts, faces, material, p=None, colors=None):
    me = bpy.data.meshes.new(name + ' · mesh')
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    for face in me.polygons: face.use_smooth = True
    if colors is not None:
        ca = me.color_attributes.new(name='Color', type='BYTE_COLOR', domain='POINT')
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
            if material==SKIN:
                # Genuine sculpt relief: low-amplitude directional micro-ridges.
                # Dense surfaces sample the ridge function; the exported GLB keeps it.
                xx,yy,zz=loc[0]+x,loc[1]+y,loc[2]+z
                grain=noise.noise(Vector((xx*112,yy*112,zz*112)), noise_basis='PERLIN_NEW')
                flow=sin(zz*153+grain*4+xx*27)*sin(xx*83+yy*98)
                relief=.00090*grain+.00030*flow
                n=Vector((x/(scale[0]**2),y/(scale[1]**2),z/(scale[2]**2))).normalized()
                x+=n.x*relief;y+=n.y*relief;z+=n.z*relief
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
    # Broad lifted cheeks with a narrower crown and tucked lower jaw.
    x*=1+.10*exp(-((z+.26)/.31)**2)-.055*smooth(.34,.84,z)
    if y<0:
        front=smooth(0,.5,-y)
        eyes=.080*(exp(-((x-.415)/.205)**2-((z-.17)/.205)**2)+exp(-((x+.415)/.205)**2-((z-.17)/.205)**2))
        muzzle=.10*exp(-(x/.43)**4-((z+.24)/.27)**2)
        cheeks=.072*exp(-((abs(x)-.70)/.26)**2-((z+.25)/.26)**2)
        y+=front*(eyes-muzzle-cheeks)
        z+=.025*front*exp(-((abs(x)-.68)/.25)**2-((z+.25)/.28)**2)
    return x,y,z

def head_color(v):
    x,y,z=v
    front=smooth(.14,.50,-y)
    edge=2.49+.070*(abs(x)/1.05)**1.4
    cream=(1-smooth(edge-.033,edge+.045,z))*front
    c=mix(COAT,CHEEK,cream)
    blush=exp(-((abs(x)-.77)/.178)**4-((z-2.29)/.153)**4)*front*.90
    c=mix(c,BLUSH,blush)
    variation=1+.020*sin(x*81+z*69)*sin(y*91-z*53)
    return tuple(min(1,ch*variation) for ch in c)

head=ellipsoid('Sculpted head · cheeks sockets muzzle and short-plush relief',(0,0,2.53),(1.065,.754,.82),SKIN,HEAD,512,288,.94,head_deform,head_color)

def body_deform(x,y,z):
    x*=1+.12*exp(-((z+.3)/.45)**2)-.15*smooth(.2,.88,z)
    z+=.04*(1-exp(-(x/.22)**2))*(1-smooth(-.85,-.65,z))
    return x,y,z

def body_color(v):
    x,y,z=v
    oval=(x/.57)**2+((z-1.02)/.67)**2
    cream=(1-smooth(.76,1.18,oval))*smooth(.16,.42,-y)
    return mix(COAT,CHEEK,cream)

body=ellipsoid('Sculpted pear body · cream belly',(0,.07,1.045),(.825,.62,.89),SKIN,RIG,448,288,.94,body_deform,body_color)

# Ears are a continuous sculpted cup. The inner bowl is genuinely recessed,
# with a rolled rim and a soft lower fold; colour follows radial anatomy.
for side, suffix in [(1,'L'),(-1,'R')]:
    ex=side*.81;ez=3.26
    def ear_shape(x,y,z):
        radial=(x/.325)**2+(z/.335)**2
        if y<0: y+=.098*exp(-(radial/.58)**2)
        return x,y,z
    def ear_colour(v, ex=ex, ez=ez):
        x,y,z=v
        radial=((x-ex)/.325)**2+((z-ez)/.335)**2
        pink=(1-smooth(.40,.70,radial))*smooth(-.02,.08,-y)
        c=mix(COAT,BLUSH,pink*.80)
        return mix(c,CHEEK,.08*(1-pink))
    ellipsoid('Ear '+suffix+' · sculpted continuous cup',(ex,.015,ez),(.325,.18,.335),SKIN,HEAD,144,128,.98,ear_shape,ear_colour)
    stroke('Ear '+suffix+' · inner cartilage',[(ex-side*.15,-.094,ez-.13),(ex-side*.09,-.137,ez-.19),(ex+side*.06,-.134,ez-.20),(ex+side*.13,-.107,ez-.12)],.018,PINK,HEAD,64,16)

# Larger cocoa eyes sit inside the sculpted sockets. A warm iris boundary
# surrounds the dark pupil; two inset catchlights remain parented for blinking.
IRIS = mat('Eyes · amber iris rim', '#49352A', .30)
for side,suffix in [(1,'L'),(-1,'R')]:
    eye_origin=Vector((side*.405,-.756,2.69))
    eye=ellipsoid('Eye_'+suffix,tuple(eye_origin),(.108,.073,.143),IRIS,None,112,96)
    for vertex in eye.data.vertices:vertex.co-=eye_origin
    eye.location=eye_origin
    bpy.context.view_layer.update();parent(eye,HEAD)
    ellipsoid('Eye '+suffix+' · chocolate pupil',(side*.405,-.814,2.69),(.096,.032,.128),EYE,eye,96,64)
    ellipsoid('Eye '+suffix+' · softbox highlight',(side*.405-.029,-.843,2.741),(.023,.007,.032),HIGHLIGHT,eye,36,24)
    ellipsoid('Eye '+suffix+' · secondary glint',(side*.405+.031,-.841,2.663),(.008,.004,.010),HIGHLIGHT,eye,28,20)

# Glasses are a real tubular rounded rectangle, with bevels and temple arms.
def glasses_loop(cx,cz,width=.735,height=.545,corner=.155):
    pts=[]
    for ox,oz,start in [(width/2-corner,height/2-corner,0),(-width/2+corner,height/2-corner,90),(-width/2+corner,-height/2+corner,180),(width/2-corner,-height/2+corner,270)]:
        for i in range(48):
            a=(start+i/47*90)*pi/180
            # Start at right upper corner and travel around anticlockwise.
            xx=cx+ox+corner*cos(a);zz=cz+oz+corner*sin(a)
            yy=-.925+.08*(abs(xx)/.90)**2
            pts.append((xx,yy,zz))
    pts.append(pts[0])
    return pts

# Correct corner order: each quarter is traversed continuously.
for side,suffix in [(1,'L'),(-1,'R')]:
    pts=glasses_loop(side*.44,2.70)
    tube('Glasses '+suffix+' · rounded acetate frame',pts,.051,INK,HEAD,32,squash=.96,closed=True)
    stroke('Glasses '+suffix+' · temple',[(side*.825,-.861,2.78),(side*1.01,-.77,2.86),(side*1.06,-.12,2.83),(side*1.01,.14,2.67)],.040,INK,HEAD,100,24)
    ellipsoid('Glasses '+suffix+' · hinge',(side*.844,-.903,2.781),(.026,.008,.018),BRASS,HEAD,48,32)
stroke('Glasses · saddle bridge',[(-.075,-.936,2.72),(-.028,-.982,2.75),(.028,-.982,2.75),(.075,-.936,2.72)],.044,INK,HEAD,72,24)

# Nose is an original tapered heart/rounded triangle surface.
def nose_deform(x,y,z):
    x*=.64+.40*smooth(-.065,.055,z)
    z-=.011*exp(-(x/.028)**2)*smooth(0,.075,z)
    return x,y,z
ellipsoid('Nose · tiny soft heart',(0,-.934,2.385),(.128,.081,.079),MOUTH,HEAD,96,72,.95,nose_deform)
stroke('Philtrum',[(0,-.931,2.332),(0,-.929,2.31),(0,-.915,2.27),(0,-.900,2.259)],.019,MOUTH)
stroke('Smile L',[(0,-.903,2.274),(.035,-.911,2.18),(.158,-.880,2.182),(.199,-.867,2.266)],.022,MOUTH)
stroke('Smile R',[(0,-.903,2.274),(-.035,-.911,2.18),(-.158,-.880,2.182),(-.199,-.867,2.266)],.022,MOUTH)
for side in (1,-1):
    for k in range(2):
        zz=2.31-k*.07
        stroke('Whisker '+str(side)+' '+str(k),[(side*.73,-.715,zz),(side*.86,-.697,zz+.01),(side*.99,-.60,zz+.035-k*.045),(side*1.075,-.54,zz+.055-k*.08)],.0045,WHISKER,HEAD,48,10)
    # Short subtle brows above the frame.
    stroke('Brow '+str(side),[(side*.24,-.624,3.045),(side*.33,-.655,3.075),(side*.48,-.633,3.078),(side*.56,-.587,3.05)],.019,SKIN,HEAD,28,8)

# Soft arms are swept, tapered meshes and retain shoulder pivots.
for side,suffix,arm in [(1,'L',ARML),(-1,'R',ARMR)]:
    controls=[(side*.62,.005,1.64),(side*.94,-.10,1.54),(side*1.035,-.31,1.20),(side*.92,-.39,1.03)]
    pts=bezier(controls,144)
    radii=[.020+.175*(sin(pi*i/143)**.40) for i in range(144)]
    colors=[mix(COAT,BLUSH,.22*smooth(.65,1,i/143)) for i in range(144)]
    tube('Arm '+suffix+' · tapered sculpt',pts,radii,SKIN,arm,64,colors,squash=.83)
    ellipsoid('Paw '+suffix+' · palm',(side*.925,-.396,1.04),(.142,.105,.154),SKIN,arm,80,64,.94,colour=lambda p:mix(COAT,BLUSH,.35))
    for k in range(3):
        x=side*(.844+k*.079)
        ellipsoid('Paw '+suffix+' · finger '+str(k),(x,-.449,.993),(.049,.067,.082),SKIN,arm,48,32,.95,colour=lambda p:mix(COAT,BLUSH,.6))

# Feet: three articulated pink toes per foot, with subtle toenail pads.
for side,suffix in [(1,'L'),(-1,'R')]:
    ellipsoid('Foot '+suffix+' · soft pad',(side*.43,-.075,.151),(.233,.299,.151),PINK,RIG,96,64,.94)
    for k in range(3):
        x=side*.43+(k-1)*.119
        ellipsoid('Foot '+suffix+' · toe '+str(k),(x,-.296,.115),(.071,.130,.085),PINK,RIG,64,48,.95)
        ellipsoid('Foot '+suffix+' · nail '+str(k),(x,-.40,.129),(.032,.035,.012),CREAM,RIG,32,24)

# A discreet learning backpack gives the silhouette character from all sides.
ellipsoid('Backpack · padded shell',(0,.60,1.18),(.48,.21,.58),STRAP,RIG,128,96,.70)
ellipsoid('Backpack · pocket',(0,.795,1.02),(.33,.067,.26),STRAP,RIG,96,64,.70)
for side in (1,-1):
    stroke('Backpack shoulder strap '+str(side),[(side*.315,.720,1.620),(side*.60,.35,1.87),(side*.56,-.41,1.77),(side*.56,-.445,1.21)],.035,STRAP,RIG,40,10)
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

# Physical acetate edge bead and miniature slotted hinge screws.
EDGE = mat('Eyewear · polished edge bevel', '#403C35', .22)
STITCH = mat('Backpack · flax thread', '#CBA77A', .89)
for side,suffix in [(1,'L'),(-1,'R')]:
    edge=[(x,y-.040,z) for x,y,z in glasses_loop(side*.44,2.70)]
    tube('Glasses '+suffix+' · chamfer highlight',edge,.006,EDGE,HEAD,8,closed=True)
    for k in (-1,1):
        sx=side*(.829+k*.015);sz=2.784
        ellipsoid('Hinge screw '+suffix+str(k),(sx,-.915,sz),(.006,.003,.006),BRASS,HEAD,28,16)
        stroke('Hinge screw slot '+suffix+str(k),[(sx-.003,-.918,sz),(sx-.001,-.918,sz),(sx+.001,-.918,sz),(sx+.003,-.918,sz)],.0012,INK,HEAD,8,6)
    for k in range(3):
        x=side*(.844+k*.079)
        ellipsoid('Paw '+suffix+' · fingernail '+str(k),(x,-.525,1.003),(.020,.007,.024),CREAM,ARML if side==1 else ARMR,32,24)
        # Fine knuckle crease is inset against the rounded finger.
        stroke('Paw crease '+suffix+str(k),[(x-.021,-.490,1.045),(x-.007,-.501,1.048),(x+.007,-.501,1.048),(x+.021,-.490,1.045)],.0026,PINK,ARML if side==1 else ARMR,20,8)

# Main backpack seam follows the rounded shell edge, with distinct thread stitches.
seam=[]
for j in range(192):
    a=2*pi*j/192
    seam.append((.425*spow(cos(a),.72),.731,1.18+.51*spow(sin(a),.72)))
tube('Backpack · perimeter piping',seam,.010,STRAP,RIG,10,closed=True)
for j in range(0,192,3):
    a=Vector(seam[j]);b=Vector(seam[(j+1)%192]);a.y=.744;b.y=.744
    tube('Backpack · saddle stitch '+str(j),[a,b],.0035,STITCH,RIG,8)
# Flax stitches run round the front pocket.
for j in range(64):
    a=2*pi*j/64;b=a+.052
    aa=(.287*spow(cos(a),.72),.859,1.02+.219*spow(sin(a),.72))
    bb=(.287*spow(cos(b),.72),.859,1.02+.219*spow(sin(b),.72))
    tube('Pocket stitch '+str(j),[aa,bb],.003,STITCH,RIG,8)
# Two rows of staggered zipper teeth and a visible pull tab at upper right.
for j in range(35):
    x=-.33+j*.019
    for row in (-1,1):
        ellipsoid('Zipper tooth '+str(j)+' '+str(row),(x+row*.004,.803,1.41+row*.011),(.007,.004,.007),BRASS,RIG,12,8,.45)
ring=[]
for j in range(48):
    a=2*pi*j/48;ring.append((.322+.021*cos(a),.817,1.387+.04*sin(a)))
tube('Zipper · pull ring',ring,.007,BRASS,RIG,10,closed=True)

# Short groomed crown fibres. These lie almost flat against the surface and give
# the silhouette a soft edge; no long spikes or hair cards are used.
for j in range(180):
    a=random.uniform(0,2*pi);t=random.uniform(.19,1.15)
    x=1.065*sin(t)*cos(a);y=.754*sin(t)*sin(a);z=.82*cos(t)
    x,y,z=head_deform(x,y,z)
    if y<-.15 and z<.40:continue
    p=Vector((x,y,2.53+z));n=Vector((x/(1.065**2),y/(.754**2),z/(.82**2))).normalized()
    tangent=Vector((-sin(a),cos(a),-.24)).normalized()
    pts=[p+n*.0005,p+tangent*.010+n*.003,p+tangent*.021+n*.005,p+tangent*.031+n*.003]
    tube('Short plush crown fibre '+str(j),pts,[.0018,.0022,.0014,.0002],SKIN,HEAD,6)

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
triangles=0;vertices=0;polygons=0
# Normalize the authored character to exactly 3.6 units and put it on the floor.
coords=[o.matrix_world @ Vector(corner) for o in character if o.type=='MESH' for corner in o.bound_box]
lo=min(p.z for p in coords); hi=max(p.z for p in coords)
RIG.scale=(3.6/(hi-lo),)*3
RIG.location.z=-lo*RIG.scale.z
bpy.context.view_layer.update()
for o in character:
    if o.type=='MESH':
        o.data.calc_loop_triangles()
        triangles+=len(o.data.loop_triangles);vertices+=len(o.data.vertices);polygons+=len(o.data.polygons)
coords=[o.matrix_world @ Vector(corner) for o in character if o.type=='MESH' for corner in o.bound_box]
bounds={'min':[min(p[k] for p in coords) for k in range(3)],'max':[max(p[k] for p in coords) for k in range(3)]}

bpy.ops.object.select_all(action='DESELECT')
for o in character:o.select_set(True)
bpy.context.view_layer.objects.active=RIG
glb=os.path.join(ROOT,'web','public','models','hamster-v3.glb')


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
bpy.ops.object.camera_add(location=(3.2,-10.5,3.5))
cam=bpy.context.object;cam.name='Studio · portrait camera'
target=Vector((0,0,1.81));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=4.25
bpy.context.scene.camera=cam
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24 if DRAFT else 48
scene.cycles.use_denoising=True
scene.render.resolution_x=1000 if DRAFT else 1600;scene.render.resolution_y=1200 if DRAFT else 1920;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.render.filepath=os.path.join(ROOT,'web','public','brand','hamster-v3-poster.png')

# Set a useful editable viewport and select the character root.
bpy.ops.object.select_all(action='DESELECT');RIG.select_set(True);bpy.context.view_layer.objects.active=RIG
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.region_3d.view_distance=6
            a.spaces.active.region_3d.view_location=(0,0,1.8)

blend=os.path.join(ROOT,'blender','hamster-v3.blend')
bpy.context.preferences.filepaths.save_version=0
# Keep the editable quad authoring mesh and ship a triangle-applied master.
# Thus Blender's visible polygon count also meets the user's million-face request.
authoring_polygons=polygons
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','hamster-v3-authoring.blend'),compress=True)
for o in character:
    if o.type!='MESH':continue
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True);bpy.context.view_layer.objects.active=o
    modifier=o.modifiers.new('Applied million-face delivery triangulation','TRIANGULATE')
    modifier.quad_method='SHORTEST_DIAGONAL'
    bpy.ops.object.modifier_apply(modifier=modifier.name)
polygons=sum(len(o.data.polygons) for o in character if o.type=='MESH')
triangles=polygons
bpy.ops.object.select_all(action='DESELECT')
for o in character:o.select_set(True)
bpy.context.view_layer.objects.active=RIG
bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=blend,compress=True)
stats={
    'name':'AI Hamster Guide V3','generated_at':'2026-09-08','blender_version':bpy.app.version_string,
    'source_script':'blender/build_hamster_v3.py','triangles':triangles,'vertices':vertices,'blender_polygons':polygons,'authoring_polygons_before_triangulation':authoring_polygons,'geometry_requirement':'1,000,000 to 1,050,000 real exported triangles',
    'mesh_objects':sum(o.type=='MESH' for o in character),'materials':len({m.name for o in character if o.type=='MESH' for m in o.data.materials}),
    'glb_bytes':os.path.getsize(glb),'glb_sha256':hashlib.sha256(open(glb,'rb').read()).hexdigest(),'blender_bounds':bounds,'height':bounds['max'][2]-bounds['min'][2],
    'runtime_nodes':{name:list(bpy.data.objects[name].location) for name in ['HamsterRoot','Head','Eye_L','Eye_R','Arm_L','Arm_R']},
    'front':{'blender':'-Y','gltf':'+Z'},'up':{'blender':'+Z','gltf':'+Y'},
    'textures':0,'animations':'runtime-procedural; independent shoulder, head and eye pivots',
    'old_assets_preserved':True
}
with open(os.path.join(OUT,'model-stats.json'),'w') as f:json.dump(stats,f,ensure_ascii=False,indent=2)
print('MODEL_STATS',json.dumps(stats))
assert triangles>=1000000, f'Below million triangle requirement: {triangles}'
assert triangles<=1050000, f'Above 1.05M target: {triangles}'
assert os.path.getsize(glb)<50*1024*1024, 'Asset size budget exceeded'
bpy.ops.render.render(write_still=True)
import shutil
shutil.copy2(scene.render.filepath,os.path.join(OUT,'model-render.png'))
# Documentary first-pass/final evidence; the poster remains the browser fallback.
shutil.copy2(scene.render.filepath,os.path.join(OUT,'model-renders','v3-first-pass.png' if DRAFT else 'v3-final-portrait.png'))
print('HAMSTER_V3_COMPLETE')
