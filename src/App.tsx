import React, { useEffect, useRef, useMemo } from "react";
import { CanvasManager } from "./utils";
import * as THREE from "three";

function App() {
  const canvasContainer = useRef<HTMLDivElement>(null);
  const canvasManager = useMemo(() => {
    return new CanvasManager();
  }, []);

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
    });
    const geo = new THREE.BoxGeometry();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    canvasManager.add(mesh);

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
