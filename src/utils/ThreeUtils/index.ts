import * as THREE from "three";

export class ThreeUtils {
  private static v = new THREE.Vector3();
  private static identity = new THREE.Matrix4().identity();

  /**
   * This centers the geometry of the mesh, while shifting the mesh in the direction
   * so that the global coordinates of vertices of geometry appear at the same
   * positions.
   * @param mesh of target
   */

  public static centerGeometryAndShiftMesh(mesh: THREE.Mesh) {
    mesh.geometry.computeBoundingBox();
    (mesh.geometry.boundingBox as THREE.Box3).getCenter(this.v);
    mesh.geometry.center();
    const distance = this.v.length();
    mesh.translateOnAxis(this.v.normalize(), distance);
  }

  /**
   * This returns an array of all non-identity matrices in ancestors, in ascending
   * order of hierarchy.
   * @param object is the object lowest in hierarchy
   * @param startingUuid is the uuid of the object that is at the top of hierarchy
   * @returns array of non-identity matrices attached to ancestors. Note that these
   * matrices refer to actual meshes, i.e. they have not been cloned.
   */

  public static getAncestralTransformations(
    object: THREE.Object3D,
    startingUuid: string
  ) {
    return this.getAncestralTransformationsRecursively(object, startingUuid);
  }

  // Private helpers

  private static getAncestralTransformationsRecursively(
    object: THREE.Object3D,
    startingUuid: string,
    transformations: THREE.Matrix4[] = []
  ): THREE.Matrix4[] {
    object.updateMatrix();
    if (!this.isIdentity(object.matrix)) transformations.push(object.matrix);
    if (object.uuid === startingUuid) return transformations;
    if (!object.parent) return [];
    return this.getAncestralTransformationsRecursively(
      object.parent,
      startingUuid,
      transformations
    );
  }

  private static isIdentity(matrix: THREE.Matrix4) {
    return matrix.equals(this.identity);
  }
}
