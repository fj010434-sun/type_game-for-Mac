"""Blender authoring of two uniforms on the original Kenney seven-bone rig.
Run: Blender --background --python scripts/build_uniform_samples.py
Runtime uses compact geometry JSON; GLB and .blend are reproducible authoring deliveries.
All new garment dimensions are design choices, not inferred historical uniform specifications.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'web/assets/wardrobe'
AUTHOR=ROOT/'art/wardrobe';AUTHOR.mkdir(parents=True,exist_ok=True)
source=json.loads((OUT/'parts.json').read_text())['parts']
BONES=['root','leg-left','leg-right','torso','arm-left','arm-right','head']
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'web/assets/characters/character-male-c.glb'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
# Original mesh is preserved as reference only, never exported with either uniform.
for o in list(bpy.data.objects):
 if o.type=='MESH':o.hide_render=True;o.hide_set(True)

def clip(poly,axis,bound,above):
 result=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  av=a[axis]-bound;bv=b[axis]-bound;ai=av>=-1e-9 if above else av<=1e-9;bi=bv>=-1e-9 if above else bv<=1e-9
  if ai:result.append(a)
  if ai!=bi:
   t=av/(av-bv);result.append(tuple(a[i]+t*(b[i]-a[i]) for i in range(3)))
 return result

def original(name,only_joint=None,skin_cut=None):
 d=source[name];verts=[];faces=[];joints=[]
 for k in range(0,len(d['indices']),3):
  ids=d['indices'][k:k+3];js=[d['joints'][i][0] for i in ids]
  if only_joint is not None and not all(j in only_joint for j in js):continue
  assert len(set(js))==1,'This reference has rigid per-bone weights; clipping needs an interpolating bind if that changes.'
  poly=[tuple(d['positions'][i]) for i in ids]
  if skin_cut is not None:poly=clip(poly,0,skin_cut if js[0]==4 else -skin_cut,js[0]==4)
  if len(poly)<3:continue
  offset=len(verts);verts.extend(poly);joints.extend([js[0]]*len(poly))
  for i in range(1,len(poly)-1):
   a,b,c=map(Vector,(poly[0],poly[i],poly[i+1]))
   if (b-a).cross(c-a).length_squared>1e-17:faces.append((offset,offset+i,offset+i+1))
 return verts,faces,joints

def tube_x(side,start,end,ry,rz,joint):
 # Arms in the reference rest pose extend sideways; cuffs stay on the same arm bone.
 v=[];f=[];n=12
 for x,scale in [(start,1.13),(end,.94)]:
  for i in range(n):
   a=2*math.pi*i/n;v.append((side*x,.28775+ry*scale*math.cos(a),.018+rz*scale*math.sin(a)))
 for i in range(n):
  q=(i+1)%n;f.extend([(i,q,n+q),(i,n+q,n+i)])
 f.extend([(0,i+1,i) for i in range(1,n-1)]);f.extend([(n,n+i,n+i+1) for i in range(1,n-1)])
 return v,f if side==1 else [tuple(reversed(t)) for t in f],[joint]*len(v)

def boot(side,joint):
 v=[];f=[];n=12
 # Low-poly oval shaft, substantial height and clearance outside the trouser leg.
 for y,rx,rz,z in [(.018,.075,.105,-.006),(.05,.081,.111,-.006),(.125,.076,.088,-.019),(.137,.079,.09,-.019)]:
  for i in range(n):
   a=2*math.pi*i/n;v.append((side*.083571+rx*math.cos(a),y,z+rz*math.sin(a)))
 for row in range(3):
  for i in range(n):
   a=row*n+i;b=row*n+(i+1)%n;c=b+n;d=a+n;f.extend([(a,b,c),(a,c,d)])
 f.extend([(0,i+1,i) for i in range(1,n-1)]);f.extend([(3*n,3*n+i,3*n+i+1) for i in range(1,n-1)])
 return v,[tuple(reversed(t)) for t in f],[joint]*len(v)

def merge(*parts):
 v=[];f=[];j=[]
 for vv,ff,jj in parts:
  offset=len(v);v.extend(vv);j.extend(jj);f.extend(tuple(i+offset for i in t) for t in ff)
 return v,f,j

def make(name,data,color,collection):
 v,f,j=data
 # Authoring Z-up -> runtime Y-up. The reference GLB importer uses the same conversion.
 mesh=bpy.data.meshes.new(name);mesh.from_pydata([(x,-z,y) for x,y,z in v],[],f);mesh.update()
 obj=bpy.data.objects.new(name,mesh);collection.objects.link(obj);obj.parent=rig;obj.matrix_parent_inverse=rig.matrix_world.inverted()
 mat=bpy.data.materials.new(name+'_Fabric');mat.diffuse_color=(*color,1);obj.data.materials.append(mat)
 for bn in BONES:obj.vertex_groups.new(name=bn)
 for index,joint in enumerate(j):obj.vertex_groups[BONES[joint]].add([index],1,'REPLACE')
 mod=obj.modifiers.new('OriginalSkeleton','ARMATURE');mod.object=rig
 # Keep flat corner normals consistent with the original low-poly style.
 mesh.calc_loop_triangles()
 result={'positions':[],'normals':[],'uv':[],'joints':[],'weights':[],'indices':[]}
 for tri in mesh.loop_triangles:
  for li in tri.loops:
   loop=mesh.loops[li];co=mesh.vertices[loop.vertex_index].co;normal=tri.normal
   result['positions'].append([co.x,co.z,-co.y]);result['normals'].append([normal.x,normal.z,-normal.y]);result['uv'].append([0,0]);result['joints'].append([j[loop.vertex_index],0,0,0]);result['weights'].append([1,0,0,0]);result['indices'].append(len(result['indices']))
 return obj,result

variants={};objects={}
for style,end in [('duty',.238),('jacket',.335)]:
 col=bpy.data.collections.new('CH_'+style.title());bpy.context.scene.collection.children.link(col)
 shirt=merge(original('shirt',[3]),tube_x(1,.095,end,.06,.079,4),tube_x(-1,.095,end,.06,.079,5))
 skin=original('skin',skin_cut=end-.006)
 pants=original('pants');shoes=original('shoes') if style=='duty' else merge(original('shoes'),boot(1,1),boot(-1,2))
 variants[style]={};objects[style]=[]
 for name,data,color in [('shirt',shirt,(.38,.50,.68) if style=='duty' else (.12,.23,.37)),('skin',skin,(.80,.49,.30)),('pants',pants,(.18,.23,.29)),('shoes',shoes,(.055,.07,.10))]:
  obj,result=make('CH_'+style.title()+'_'+name+'_LOD0',data,color,col);variants[style][name]=result;objects[style].append(obj)
(OUT/'uniforms.json').write_text(json.dumps({'version':1,'boneNames':BONES,'source':'Kenney Mini Characters CC0; original uniform design','variants':variants},separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=str(AUTHOR/'base-meshes.blend'))
for style,obs in objects.items():
 bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(AUTHOR/(style+'-body.glb')),use_selection=True,export_animations=False,export_skins=True,export_yup=True)
 # Reimport into a fresh scene and verify weights and intended meshes survived export.
 existing=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=str(AUTHOR/(style+'-body.glb')))
 imported=[o for o in bpy.data.objects if o not in existing];meshes=[o for o in imported if o.type=='MESH' and o.name.startswith('CH_')]
 assert len(meshes)==4 and all(o.vertex_groups for o in meshes),'GLB roundtrip lost skin bindings'
 for o in imported:bpy.data.objects.remove(o,do_unlink=True)
print('PASS: authored two uniforms, original skeleton weights, 2 GLB roundtrips')
