# three-merge-split

This a tool for splitting and merging the geometries inside three.js.
The package itself does not have threejs installed, so the users will need to provide threejs package they are using.

## Usage

Two utilities this package provides are Splitter and Merger.
Note that this package was developed using three@0.139.2. Although it allows the users to pass in THREE library they are using, if it does not support the desired version, please feel free to fork it from our [repo](https://github.com/zTech-ca/three-merge-split) and modify it. (Hint: Start by installing desired threejs version and also its typescript support.)

### Splitter

This helps the users split the geometry or mesh into several different parts, based on the groups property of geometry. (See threejs documentation for more details).

To prepare a loader, the users must first create Splitter object using the THREE library they are currently using.

```javascript
import * as THREE from "three";
import { Splitter } from "three-merge-split";

const splitter = new Splitter(THREE);
```

For demo purpose, consider the following geometries and mesh.

```javascript
const box1 = new THREE.BoxGeometry();
const box2 = new THREE.BoxGeometry();

const mesh = new THREE.Mesh(box2, undefined);
```

Note that box1's groups property is an array of 6 groups, each of which represents the corresponding face, like following (three@0.139.2):

> {start: 0, count: 6, materialIndex: 0}
> {start: 6, count: 6, materialIndex: 1}
> {start: 12, count: 6, materialIndex: 2}
> {start: 18, count: 6, materialIndex: 3}
> {start: 24, count: 6, materialIndex: 4}
> {start: 30, count: 6, materialIndex: 5}

After the splitter class is created, the users have access to following public functionalities.

##### Split the geometry

```javascript
const faceGeometries = splitter.split(box1);
```

##### Split the mesh

This splits the provided mesh's geometry based on groups the create new mesh for each of created group. These newly created meshes will share the same material as provided meshes'.

```javascript
const faceMeshes = splitter.split(mesh);
```

##### Split the geometry by material index

```javascript
const box1.groups[3].materialIndex = 0;
const box1.groups[4].materialIndex = 1;
const box1.groups[5].materialIndex = 2;

const faceGeometries = splitter.splitByMaterialIndex(box1);
```

##### Split the geometry by material index

```javascript
const faceGeometries = splitter.splitByGroups(box1, 2);
```

### Merger

Contrary to Splitter, this merges provided geometries or meshes.

Similar to Splitter, we initialize Merger like following:

```javascript
import * as THREE from "three";
import { Merger } from "three-merge-split";

const merger = new Merger(THREE);
```

For this section, consider the following geometries and meshes.

```javascript
const box1 = new THREE.BoxGeometry();
const box2 = new THREE.BoxGeometry().translate(1, 0, 0);
const box3 = new THREE.BoxGeometry().translate(-1, 0, 0);
const box4 = new THREE.BoxGeometry();
const box5 = new THREE.BoxGeometry().translate(0, 1, 0);
const box6 = new THREE.BoxGeometry().translate(0, -1, 0);

const mesh1 = new THREE.Mesh(box4);
const mesh2 = new THREE.Mesh(box5);
const mesh3 = new THREE.Mesh(box6);

mesh2.translateX(1);
mesh3.translateX(-1);
```

The users have access to the following functionalities.

##### Merge the geometries

```javascript
const geometry = merger.merge([box1, box2, box3], true, true);
```

##### Merge the meshes

```javascript
const geometry = merger.merge([mesh1, mesh2, mesh3], true, true, true);
```

## For contributors

To publish this, run

```javascript
npm run build
npm publish
```
