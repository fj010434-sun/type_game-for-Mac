"""Create complete editable Blender masters from the runtime-exported GLBs."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'art/wardrobe'
report={}
for style in ['duty','jacket','traffic']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(OUT/(style+'.glb')))
 meshes=[o for o in bpy.data.objects if o.type=='MESH' and o.name!='Icosphere']
 rigs=[o for o in bpy.data.objects if o.type=='ARMATURE']
 assert len(meshes)>25 and len(rigs)==1,'Incomplete assembled uniform'
 assert len(bpy.data.actions)>=30,'Original animation library missing'
 for mesh in meshes:
  assert all(all(__import__('math').isfinite(v) for v in vertex.co) for vertex in mesh.data.vertices)
 report[style]={'meshes':len(meshes),'rigs':len(rigs),'actions':len(bpy.data.actions),'triangles':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons)}
 # Original clips are editable actions on the same original seven-bone armature.
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(style+'.blend')))
(OUT/'asset-manifest.json').write_text(json.dumps({'source':'Kenney Mini Characters CC0, custom uniform geometry and details','authoring':'Blender 4.5.3','runtime':'Three.js r170','units':'Original model units; full delivered character has runtime scale 2','axes':'GLB Y up, Blender Z up','skeleton':['root','leg-left','leg-right','torso','arm-left','arm-right','head'],'materials':'Solid colors; exported PBR roughness 0.82 approximates runtime Lambert lighting','animations':'All 32 original clips; no new motion or cloth simulation','inferred':'New sleeve length, collar, pockets, cuff and boot designs are original choices fitted to the existing character','delivery':report},ensure_ascii=False,indent=2))
print('PASS: complete GLB reimports with details, rig and animations; editable .blend masters saved')
