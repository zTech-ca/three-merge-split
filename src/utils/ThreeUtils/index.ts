import * as THREE from "three";
import { AttributeProperty } from "../../types";

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

  /**
   * Apply transformations to target geometry in order
   * @param geometry is the target to be transformed
   * @param transformations array of matrix4 containing transformations
   * @returns transformed geometry. Note that it is the same geometry as parameter.
   */

  public static applyTransforms(
    geometry: THREE.BufferGeometry,
    transformations: THREE.Matrix4[]
  ) {
    return transformations.reduce(
      (acc, transformation) => acc.applyMatrix4(transformation),
      geometry
    );
  }

  /**
   * This creates an array of sorted integer from starting number to
   * starting number + length - 1 in ascending order.
   * @param length of the array
   * @param start is the starting number. Default is 0
   * @returns sorted array of integer from starting number to
   * starting number + length - 1.
   */

  public static getSortedIntegers(length: number, start = 0) {
    if (start) {
      let arr = [];
      for (let e = start; e < start + length; arr.push(e++)) {}
      return arr;
    } else return Array.from(Array(length).keys());
  }

  /**
   * This simply returns the first material inside the mesh if material
   * property is an array. Otherwise, it will return mesh's material.
   * This could be useful in obtaining one default material.
   * @param mesh that contains material to be extracted.
   * @returns one material
   */

  public static getFirstMaterial(mesh: THREE.Mesh) {
    return Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  }

  /**
   * This clones and returns buffer geometry. In normal cloning by threejs
   * library, any undefined materialIndex is turned into 0 upon conversion.
   * This helps to retain the groups.
   * @param geometry to be cloned
   * @returns cloned buffer geometry
   */

  public static cloneBufferGeometry(geometry: THREE.BufferGeometry) {
    const clone = geometry.clone();
    clone.groups = geometry.groups;
    return clone;
  }

  // Public getters

  public static get attributeProperties() {
    return Object.keys(AttributeProperty) as AttributeProperty[];
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
