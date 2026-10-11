import unittest,json,math
from pathlib import Path
class Assets(unittest.TestCase):
 def test_body_parts_preserve_skinning_and_cover_source(self):
  path=Path('web/assets/wardrobe/parts.json')
  self.assertTrue(path.exists(),'modular body assets must exist')
  data=json.loads(path.read_text()); self.assertEqual(set(data['parts']),{'shirt','pants','shoes','skin'})
  self.assertEqual(sum(len(x['indices']) for x in data['parts'].values()),data['sourceIndexCount'])
  for name,part in data['parts'].items():
   self.assertGreater(len(part['indices']),0,name)
   self.assertTrue(all(0<=i<len(part['positions']) for i in part['indices']))
   for p,j,w in zip(part['positions'],part['joints'],part['weights']):
    self.assertTrue(all(math.isfinite(v) for v in p));self.assertAlmostEqual(sum(w),1,places=5)
    self.assertTrue(all(0<=v<7 for v in j))
if __name__=='__main__':unittest.main()
