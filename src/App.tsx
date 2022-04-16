import React, { useEffect, useRef, useMemo } from "react";
import { CanvasManager, Splitter } from "./utils";
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

    console.log("=== anv ===", yaminoma5);

    const mesh = new THREE.Mesh(yaminoma5[5], mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    canvasManager.add(mesh);

    const loader = new FBXLoader();
    loader.load(
      "models/sofa.fbx",
      (obj) => {
        console.log(
          "show this????",
          obj,
          obj.children[0].children[0].children[0]
        );

        const chairMesh = obj.children[0].children[0].children[0] as THREE.Mesh;

        const yaminoma2 = Splitter.split(chairMesh.geometry);

        console.log("show yaminoma kun here", yaminoma2);

        const yaminoma3 = Splitter.splitByGroups(chairMesh.geometry, [1, 3]);

        const yaminoma6 = Splitter.splitByMaterialIndex(chairMesh.geometry);

        const mesh2 = new THREE.Mesh(yaminoma6[1], mat);

        canvasManager.add(mesh2);
      },
      (e) => {
        console.log("error has happened");
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
    ></div>
  );
}

export default App;
