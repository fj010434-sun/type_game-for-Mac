"""Split Kenney CC0 body triangles without changing positions, UVs or bone weights."""
import json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
b=(ROOT/'web/assets/characters/character-male-c.glb').read_bytes()
n=struct.unpack_from('<I',b,12)[0];doc=json.loads(b[20:20+n]);binary=b[28+n:]
def accessor(index):
 a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
 component={5126:'f',5123:'H',5121:'B',5125:'I'}[a['componentType']]
 count={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
 fmt='<'+component*count;stride=v.get('byteStride',struct.calcsize(fmt))
 offset=v.get('byteOffset',0)+a.get('byteOffset',0)
 return [list(struct.unpack_from(fmt,binary,offset+i*stride)) for i in range(a['count'])]
mesh=next(m for m in doc['meshes'] if m['name']=='body-mesh')['primitives'][0]
names={'positions':'POSITION','normals':'NORMAL','uv':'TEXCOORD_0','joints':'JOINTS_0','weights':'WEIGHTS_0'}
data={k:accessor(mesh['attributes'][v]) for k,v in names.items()}
indices=[x[0] for x in accessor(mesh['indices'])]
parts={k:{**data,'indices':[]} for k in ['shirt','pants','shoes','skin']}
for start in range(0,len(indices),3):
 tri=indices[start:start+3];y=sum(data['positions'][i][1] for i in tri)/3
 u=sum(data['uv'][i][0] for i in tri)/3;v=sum(data['uv'][i][1] for i in tri)/3
 joint=max(range(7),key=lambda j:sum(sum(w for jj,w in zip(data['joints'][i],data['weights'][i]) if jj==j) for i in tri))
 if u>.9 and v>.75:part='skin'
 elif joint in [1,2]:part='shoes' if y<.055 else 'pants'
 elif joint==3 and y<.175:part='pants'
 else:part='shirt'
 parts[part]['indices'].extend(tri)
out=ROOT/'web/assets/wardrobe';out.mkdir(parents=True,exist_ok=True)
(out/'parts.json').write_text(json.dumps({'source':'Kenney Mini Characters, CC0','sourceIndexCount':len(indices),'parts':parts},separators=(',',':')))
print('Generated modular body:',{k:len(v['indices'])//3 for k,v in parts.items()})
