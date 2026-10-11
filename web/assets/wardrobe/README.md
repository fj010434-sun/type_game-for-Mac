# Police wardrobe assets

Body: Kenney Mini Characters `character-male-c.glb`, CC0. `scripts/build_wardrobe_assets.py` deterministically partitions the original indexed triangles by joint, atlas region and height, without changing positions, UVs or skin weights. Run `python3 scripts/build_wardrobe_assets.py` to reproduce `parts.json`.

Modular head, hair, facial features and uniform details: original parametric meshes in `web/wardrobe-character.js`, MIT, matching the source skeleton and character proportions. The original head is hidden rather than covered, so there are no duplicate facial features. All combinations in the first edition share face anchors; hats use reduced hair volumes.
