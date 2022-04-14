import * as THREE from "three";
import { ThreeUtils } from "../index";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";

export class Merger {
  // Public methods available to users

  // High-level geometry manipulation tools

  public static mergeMeshes() {
    //
  }

  // Basic geometry manipulation tools

  public static merge(geometries: THREE.BufferGeometry[], useGroups: boolean) {
    return BufferGeometryUtils.mergeBufferGeometries(geometries, useGroups);
  }
}
