import React, { useEffect, useRef, useMemo } from "react";
import { CanvasManager, Splitter, ThreeUtils } from "./utils";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

function App() {
  const canvasManager = useMemo(() => new CanvasManager(), []);
  const canvasContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const div = canvasContainer.current;
    if (!div) return;
    canvasManager.appendToDiv(div);
    const handleResize = () => canvasManager.fitToDiv(div);
    window.addEventListener("resize", handleResize);
    return () => {
      canvasManager.removeFromDiv(div);
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasContainer, canvasManager]);

  // =================
  // EXPERIMENTAL PART
  // =================

  useEffect(() => {
    const mat = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      shininess: 100,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.BoxGeometry();

    const yaminoma = Splitter.split(geo);

    const yaminoma4 = Splitter.splitByGroups(geo, [0, 1]);

    const yaminoma5 = Splitter.splitByMaterialIndex(geo);

    // console.log("=== anv ===", yaminoma5);

    // ThreeUtils.center(yaminoma5[5]);

    const group1 = new THREE.Group();
    const group2 = new THREE.Group();
    const group3 = new THREE.Group();
    const group4 = new THREE.Group();
    const group5 = new THREE.Group();
    const group6 = new THREE.Group();

    group1.add(group2.add(group3.add(group4.add(group5.add(group6)))));

    group1.scale.set(1.2, 0.7, 5);
    group1.position.set(10, 5, -10);
    group1.rotation.set(Math.PI * 0.2, Math.PI * 1.8, Math.PI * 0.8);

    group2.scale.set(1.5, 0.9, 1.1);
    group2.position.set(1, 2, 3);
    group2.rotation.set(Math.PI * 0.5, Math.PI * 0.3, Math.PI * 1.6);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    group6.add(mesh);

    const transformations = ThreeUtils.getAncestralTransformations(
      mesh,
      group1.uuid
    );

    // ==========================
    // ==========================
    // ==========================
    // ==========================
    // ==========================

    const meshes1 = Splitter.splitMesh(mesh, true, group1.uuid);

    const mesh5 = meshes1[1];

    const mat2 = mat.clone();

    mat2.color.set(0x0000ff);

    mesh5.material = mat2;
    // mesh5.material.color.set(0x000000);

    canvasManager.add(mesh5);

    // ==========================
    // ==========================
    // ==========================
    // ==========================
    // ==========================

    console.log("show the transformations -> ", transformations);

    canvasManager.add(group1);

    const subGeo = yaminoma5[5];

    transformations.forEach((transformation) =>
      subGeo.applyMatrix4(transformation)
    );

    const mesh3 = new THREE.Mesh(subGeo, mat.clone());
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh3.material.color.set(0x00ff00);

    canvasManager.add(mesh3);

    const loader = new FBXLoader();
    loader.load(
      "models/sofa.fbx",
      (obj) => {
        // console.log(
        //   "show this????",
        //   obj,
        //   obj.children[0].children[0].children[0]
        // );

        const chairMesh = obj.children[0].children[0].children[0] as THREE.Mesh;

        const yaminoma2 = Splitter.split(chairMesh.geometry);

        // console.log("show yaminoma kun here", yaminoma2);

        const yaminoma3 = Splitter.splitByGroups(chairMesh.geometry, [1, 3]);

        const yaminoma6 = Splitter.splitByMaterialIndex(chairMesh.geometry);

        // ThreeUtils.center(yaminoma6[1]);

        // --------------------------

        group6.add(chairMesh);

        const meshes = Splitter.splitMesh(chairMesh, false, group1.uuid);

        console.log("smarter than what he thinks ----> ", meshes);

        // const mesh2 = new THREE.Mesh(yaminoma6[1], mat);

        const mesh4 = meshes[1];

        mesh4.material = mat;

        canvasManager.add(mesh4);
      },
      (progress) => {
        // console.log("error has happened", e);
      }
    );

    return () => {
      canvasManager.clear();
    };
  }, [canvasManager]);

  return (
    <div
      style={{
        width: "95vw",
        height: "95vh",
        border: "solid 5px red",
      }}
      ref={canvasContainer}
    />
  );
}

export default App;
