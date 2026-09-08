"""Small independent clay backpack, fitted to the uploaded seated hamster.
All coordinates use the source's +X-front, Z-up frame. It does not define a hamster.
"""
import bpy,math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from math import sin,cos,pi

def build_backpack(material, body):
    bagmat=material('Backpack · cocoa clay','826F59',.89)
    seam=material('Backpack · pressed seam shadow','6E5C4A',.93)
    thread=material('Backpack · shallow oat stitching','AF9979',.92)
    zipper=material('Backpack · muted clay zipper','A39479',.82)
    root=bpy.data.objects.new('ClayBackpack',None);bpy.context.collection.objects.link(root)
    surface=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
    def mesh(name,verts,faces,mat):
        me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
        ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);me.materials.append(mat);ob.parent=root
        for p in me.polygons:p.use_smooth=True
        return ob
    def power(x,n):return math.copysign(abs(x)**n,x)
    def back(z):return -.322+.42*max(.25,z)
    def shell(name,center,scale,mat,segments=96,rings=64,p=.65):
        verts=[];faces=[]
        for i in range(rings+1):
            t=pi*(.0001+.9998*i/rings)
            for j in range(segments):
                a=2*pi*j/segments
                yy=center[1]+scale[1]*power(sin(t)*cos(a),p)
                zz=center[2]+scale[2]*power(cos(t),p)
                xx=back(zz)+center[0]+scale[0]*power(sin(t)*sin(a),p)
                verts.append((xx,yy,zz))
        for i in range(rings):
            for j in range(segments):
                a=i*segments+j;b=i*segments+(j+1)%segments;faces.append((a,b,b+segments,a+segments))
        faces.extend([tuple(reversed(range(segments))),tuple(rings*segments+j for j in range(segments))])
        return mesh(name,verts,faces,mat)
    def tube(name,points,radius,mat,sides=12,squash=1,closed=False,align_surface=False):
        verts=[];faces=[];n=len(points);previous_u=None
        for i,p in enumerate(points):
            a=Vector(points[(i-1)%n] if closed else points[max(0,i-1)])
            b=Vector(points[(i+1)%n] if closed else points[min(n-1,i+1)])
            tangent=(b-a).normalized();axis=Vector((1,0,0))
            if abs(tangent.dot(axis))>.95:axis=Vector((0,0,1))
            u=tangent.cross(axis).normalized()
            if previous_u is not None and not closed:
                transported=previous_u-tangent*previous_u.dot(tangent)
                if transported.length>1e-5:u=transported.normalized()
            if align_surface:
                _,normal,_,_=surface.find_nearest(Vector(p))
                fitted=tangent.cross(normal)
                if fitted.length>1e-5:
                    fitted.normalize()
                    if previous_u is not None and fitted.dot(previous_u)<0:fitted=-fitted
                    u=fitted
            previous_u=u.copy();v=tangent.cross(u).normalized()
            r=radius[i] if isinstance(radius,list) else radius
            for k in range(sides):
                q=Vector(p)+r*(cos(2*pi*k/sides)*u+squash*sin(2*pi*k/sides)*v);verts.append(q)
        for i in range(n if closed else n-1):
            for k in range(sides):
                a=i*sides+k;b=i*sides+(k+1)%sides;faces.append((a,b,(b+sides)%len(verts),(a+sides)%len(verts)))
        if not closed:faces.extend([tuple(reversed(range(sides))),tuple((n-1)*sides+k for k in range(sides))])
        return mesh(name,verts,faces,mat)
    def bezier(control,count=64):
        a,b,c,d=map(Vector,control)
        return [(1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d for t in [i/(count-1) for i in range(count)]]
    shell('Backpack · softly pressed body',(-.019,0,.398),(.050,.127,.124),bagmat,128,96,.64)
    shell('Backpack · front pocket',(-.066,0,.359),(.016,.087,.058),bagmat,72,48,.63)
    edge=[]
    for j in range(160):
        a=2*pi*j/160;y=.117*power(cos(a),.65);z=.398+.114*power(sin(a),.65)
        edge.append((back(z)-.055,y,z))
    tube('Backpack · pressed perimeter',edge,.0019,seam,8,closed=True)
    for j in range(0,160,4):
        a=Vector(edge[j]);b=Vector(edge[(j+1)%160]);a.x-=.002;b.x-=.002
        tube('Backpack · shallow stitch '+str(j),[a,b],.0008,thread,6)
    pocket=[]
    for j in range(96):
        a=2*pi*j/96;y=.080*power(cos(a),.65);z=.359+.052*power(sin(a),.65)
        pocket.append((back(z)-.080,y,z))
    tube('Backpack · pocket pressed seam',pocket,.0012,seam,8,closed=True)
    # Subdued, small zipper: twin rails and rounded teeth, never shiny jewellery.
    for row in (-1,1):
        points=[(back(.453)-.071,-.080,.453+row*.003),(back(.453)-.071,.080,.453+row*.003)]
        tube('Backpack · zipper rail '+str(row),points,.0012,seam,8)
    for j in range(27):
        y=-.078+j*.006
        for row in (-1,1):
            shell('Backpack · zipper tooth '+str(j)+' '+str(row),(-.072,y+row*.001,.453+row*.0026),(.002,.002,.0023),zipper,12,8,.42)
    ring=[]
    for j in range(40):
        a=2*pi*j/40;z=.443+.009*sin(a)
        ring.append((back(z)-.074,.078+.005*cos(a),z))
    tube('Backpack · little pull ring',ring,.0017,zipper,8,closed=True)
    # Fit broad straps to the actual seated surface, beneath the oversized cheeks.
    # The previous free-space curve vanished into the body and exposed two fins.
    for sign in (-1,1):
        controls=[(back(.450)-.033,sign*.101,.450),(-.075,sign*.270,.337),(.177,sign*.265,.320),(.300,sign*.180,.280)]
        raw=bezier(controls,110);points=[]
        for i,p in enumerate(raw):
            co,normal,index,distance=surface.find_nearest(p)
            fitted=co+normal*.0036
            blend=min(1,i/12)
            points.append(p*(1-blend)+fitted*blend)
        for _ in range(18):
            points=[points[0]]+[(points[i-1]+2*points[i]+points[i+1])/4 for i in range(1,len(points)-1)]+[points[-1]]
        radii=[]
        for i,p in enumerate(points):
            t=max(0,(i/(len(points)-1)-.78)/.22);ease=t*t*(3-2*t)
            _,normal,_,_=surface.find_nearest(p)
            points[i]=p-normal*(.007*ease)
            radii.append(.0125*(1-.65*ease))
        tube('Backpack · wide shoulder strap '+str(sign),points,radii,bagmat,16,squash=.22,align_surface=True)
        # A pressed center groove gives the wide clay strap subtle definition.
        trim=[p+Vector((0,sign*.0014,.0008)) for p in points[15:-3]]
        tube('Backpack · strap crease '+str(sign),trim,.0007,seam,6)
    handle=bezier([(back(.514)-.033,-.034,.514),(back(.514)-.044,-.038,.555),(back(.514)-.044,.038,.555),(back(.514)-.033,.034,.514)],48)
    tube('Backpack · soft handle',handle,.0060,bagmat,12,squash=.65)
    # Static parts merge by material, keeping the backpack as an independent group.
    groups={}
    for o in list(root.children):groups.setdefault(o.data.materials[0].name,[]).append(o)
    for matname,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join();objects[0].name=matname
    return root
