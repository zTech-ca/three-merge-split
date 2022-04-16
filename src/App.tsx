import React, { useEffect, useRef, useMemo } from "react";
import { CanvasManager, Merger, Splitter, ThreeUtils } from "./utils";
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

    // group2.scale.set(1.5, 0.9, 1.1);
    // group2.position.set(1, 2, 3);
    // group2.rotation.set(Math.PI * 0.5, Math.PI * 0.3, Math.PI * 1.6);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // group6.add(mesh);

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

        // group6.add(chairMesh);

        // const transformations1 =

        const meshes = Splitter.splitMesh(chairMesh, false, group1.uuid);

        console.log("smarter than what he thinks ----> ", meshes);

        // const mesh2 = new THREE.Mesh(yaminoma6[1], mat);

        const mesh4 = meshes[1];

        mesh4.material = mat;

        canvasManager.add(mesh4);

        // ---------- merged chair:
        const mat3 = new THREE.MeshPhongMaterial({
          color: 0xff0000,
          shininess: 100,
          side: THREE.DoubleSide,
        });
        const mat4 = new THREE.MeshPhongMaterial({
          color: 0x00ff00,
          shininess: 100,
          side: THREE.DoubleSide,
        });
        const mat5 = new THREE.MeshPhongMaterial({
          color: 0x0000ff,
          shininess: 100,
          side: THREE.DoubleSide,
        });
        const mat6 = new THREE.MeshPhongMaterial({
          color: 0xffff00,
          shininess: 100,
          side: THREE.DoubleSide,
        });
        const mat7 = new THREE.MeshPhongMaterial({
          color: 0xff00ff,
          shininess: 100,
          side: THREE.DoubleSide,
        });
        const mat8 = new THREE.MeshPhongMaterial({
          color: 0x00ffff,
          shininess: 100,
          side: THREE.DoubleSide,
        });

        // mesh.geometry.deleteAttribute("uv");
        // chairMesh.geometry.deleteAttribute("uv");

        const merged =
          Merger.merge(
            [
              mesh.geometry,
              chairMesh.geometry,
              mesh.geometry
                .clone()
                .rotateX(Math.PI / 4)
                .translate(2, 0, 0),
            ],
            true,
            true
          ) || new THREE.BufferGeometry();

        console.log("show merged: ", merged);

        const mesh6 = new THREE.Mesh(merged, [
          mat3,
          mat4,
          mat5,
          mat6,
          mat7,
          mat8,
          mat3,
          mat4,
          mat5,
          mat6,
          mat7,
          mat8,
          mat3,
          mat4,
          mat5,
          mat6,
          mat7,
          mat8,
        ]);

        // const mesh6 = new THREE.Mesh(merged, mat5);

        mesh6.translateY(2);

        canvasManager.add(mesh6);

        // -------------------------------------

        const geo2 = new THREE.BoxGeometry();
        const mesh7 = new THREE.Mesh(geo2, [
          mat3,
          mat4,
          mat5,
          mat6,
          mat7,
          mat8,
        ]);

        mesh7.translateX(-2);

        // geo2.groups[2].materialIndex = undefined;

        // console.log("-----", geo2.groups);

        console.log("group: ", geo2.groups);

        canvasManager.add(mesh7);

        // -------------- STARTING NEW PART HERE ------------

        canvasManager.clear();

        console.log("--------NEW HIGH LEVEL EXPERIMENT------------");

        const geo3 = new THREE.BoxGeometry();
        const geo4 = new THREE.SphereGeometry().translate(-3, 0, 0);
        const geo5 = geo3.clone().rotateX(Math.PI / 4);

        const mesh8 = new THREE.Mesh(geo3, mat6);
        const mesh9 = new THREE.Mesh(geo4, mat8);
        const mesh10 = new THREE.Mesh(geo5, mat7);

        // geo3.groups[2].materialIndex = undefined;

        for (let i = 0; i < 6; i++) geo3.groups[i].materialIndex = undefined;

        console.log("show ? ", geo3.groups);

        console.log("show 2? ", mesh8.geometry.groups);

        // mesh8.translateX(3);
        // mesh8.translateY(3.5);

        // mesh9.translateY(3.5);

        // canvasManager.add(mesh8);
        // canvasManager.add(mesh9);
        // canvasManager.add(mesh10);

        const group1_ = new THREE.Group();
        const group2_ = new THREE.Group();
        const group3_ = new THREE.Group();
        const group4_ = new THREE.Group();
        const group5_ = new THREE.Group();
        const group6_ = new THREE.Group();

        group1_.add(
          group2_.add(group3_.add(group4_.add(group5_.add(group6_))))
        );

        group1_.scale.set(1.2, 0.7, 5);
        group1_.position.set(2, 1.5, -3);
        group1_.rotation.set(Math.PI * 0.2, Math.PI * 1.8, Math.PI * 0.8);

        // group2_.scale.set(1.5, 0.9, 1.1);
        // group2_.position.set(1, 2, 3);
        // group2_.rotation.set(Math.PI * 0.5, Math.PI * 0.3, Math.PI * 1.6);

        group6_.add(mesh8);
        group6_.add(mesh9);
        group6_.add(mesh10);
        group6_.add(chairMesh);

        // group1.traverse((obj) => {
        //   if (obj.type !== "Group") console.log("obj ????? ", obj, obj.parent);
        //   if (obj instanceof THREE.Mesh && obj.parent) obj.remove(obj.parent);
        // });

        canvasManager.add(group1_);

        console.log("show merger? ", chairMesh, mesh9);

        // return () => {
        //   canvasManager.clear();
        // };

        const useGroups = true;

        const mergedMesh = Merger.mergeMeshes(
          [mesh8, chairMesh, mesh9, mesh10].map((mesh) => {
            // return mesh;
            return { mesh, transformationReferenceUuid: group1_.uuid };
          }),
          true,
          useGroups,
          true
        );

        if (mergedMesh) {
          // mergedMesh.material = useGroups
          //   ? [
          //       mat3,
          //       mat4,
          //       mat5,
          //       mat6,
          //       mat7,
          //       mat8,
          //       mat3,
          //       mat4,
          //       mat5,
          //       mat6,
          //       mat7,
          //       mat8,
          //       mat3,
          //       mat4,
          //       mat5,
          //       mat6,
          //       mat7,
          //       mat8,
          //       mat3,
          //       mat4,
          //       mat5,
          //       mat6,
          //       mat7,
          //       mat8,
          //     ]
          //   : mat8;

          console.log("merged mesh? ", mergedMesh);

          console.log("final groups: ", mergedMesh.geometry.groups);

          // mergedMesh.translateY(1);

          // console.log("this is geo3 gorups ", geo3.groups);
          // console.log("this is giogio gorups ", geo3.clone().groups);

          canvasManager.add(mergedMesh);
        }
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
