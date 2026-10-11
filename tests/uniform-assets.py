"""Delivery contract: finite geometry, nonzero triangles, and compatible original bones."""
import json,math,struct,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class UniformAssets(unittest.TestCase):
 def test_runtime_bindings(self):
  d=json.loads((ROOT/'web/assets/wardrobe/uniforms.json').read_text())
  self.assertEqual(d['boneNames'],['root','leg-left','leg-right','torso','arm-left','arm-right','head'])
  for variant in d['variants'].values():
   for name,g in variant.items():
    self.assertEqual(len(g['positions']),len(g['normals']))
    for v,j,w in zip(g['positions'],g['joints'],g['weights']):
     self.assertTrue(all(math.isfinite(x) for x in v));self.assertAlmostEqual(sum(w),1);self.assertTrue(all(0<=x<7 for x in j))
    for i in range(0,len(g['indices']),3):
     a,b,c=[g['positions'][k] for k in g['indices'][i:i+3]]
     u=[b[k]-a[k] for k in range(3)];v=[c[k]-a[k] for k in range(3)]
     area=sum((u[(k+1)%3]*v[(k+2)%3]-u[(k+2)%3]*v[(k+1)%3])**2 for k in range(3))
     self.assertGreater(area,1e-17,name+' zero-area triangle')
 def test_glb_delivery(self):
  for style in ['duty','jacket']:
   b=(ROOT/f'art/wardrobe/{style}-body.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);binary=b[28+n:]
   self.assertEqual(len(d['meshes']),4);self.assertEqual(len(d['skins']),1)
   self.assertEqual({d['nodes'][i]['name'] for i in d['skins'][0]['joints']},{'root','leg-left','leg-right','torso','arm-left','arm-right','head'})
   for m in d['meshes']:self.assertIn('WEIGHTS_0',m['primitives'][0]['attributes'])
   for a in d['accessors']:
    if a['componentType']!=5126:continue
    view=d['bufferViews'][a['bufferView']];c={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];offset=view.get('byteOffset',0)+a.get('byteOffset',0)
    for i in range(a['count']):self.assertTrue(all(math.isfinite(x) for x in struct.unpack_from('<'+'f'*c,binary,offset+i*view.get('byteStride',4*c))))
 def test_complete_uniforms(self):
  for style in ['duty','jacket']:
   b=(ROOT/f'art/wardrobe/{style}.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n])
   self.assertGreater(len(d['meshes']),25,'Uniform details or face parts missing')
   names={x.get('name') for x in d['nodes']}
   for name in (['duty-tie'] if style=='duty' else ['jacket-zipper','jacket-cuff-arm-left','cargo-pocket-leg-left','boot-cuff-leg-left']):self.assertIn(name,names)
   self.assertEqual(len(d['animations']),32)
   self.assertTrue((ROOT/f'art/wardrobe/{style}.blend').exists())
if __name__=='__main__':unittest.main()
