import * as THREE from "three";
import { ThreeUtils } from "../ThreeUtils";
import { Attributes, Group } from "../types";

export class Splitter {
  private utils: ThreeUtils;
  private BufferGeometry: typeof THREE.BufferGeometry;
  private BufferAttribute: typeof THREE.BufferAttribute;

  // Public methods available to users

  constructor({
    Vector3,
    Matrix4,
    BufferGeometry,
    BufferAttribute,
  }:
    | typeof THREE
    | {
        Vector3: typeof THREE.Vector3;
        Matrix4: typeof THREE.Matrix4;
        BufferGeometry: typeof THREE.BufferGeometry;
        BufferAttribute: typeof THREE.BufferAttribute;
      }) {
    this.utils = new ThreeUtils({ Vector3, Matrix4 });
    this.BufferGeometry = BufferGeometry;
    this.BufferAttribute = BufferAttribute;
  }

  // High-level geometry manipulation tools

  /**
   * This splits the meshes. Each mesh shares the material contained in
   * original mesh, and material property is not an array. Optionally,
   * user can choose the center the geometry while placing the mesh back
   * so that the global coordinates of vertices stay the same place. Also,
   * the user may optionally apply transformations to geometry from based
   * on transformations of ancestors.
   * @param mesh of target
   * @param center is a boolean indicating whether to center the geometry
   * @param transformationReferenceUuid is the uuid of ancestor that has
   * highest hierarchy, from where transformations of descendants should
   * be accounted.
   * @returns splitted meshes.
   */

  public splitMesh(
    mesh: THREE.Mesh,
    center = false,
    transformationReferenceUuid?: string
  ) {
    const geometries = this.split(mesh.geometry);
    const transformations = transformationReferenceUuid
      ? this.utils.getAncestralTransformations(
          mesh,
          transformationReferenceUuid
        )
      : [];

    return geometries.map((geometry, i) => {
      const splittedMesh = mesh.clone();
      splittedMesh.geometry = geometry;

      this.utils.applyTransforms(geometry, transformations);

      if (Array.isArray(mesh.material)) {
        const materialIndex = mesh.geometry.groups[i].materialIndex;
        if (materialIndex === undefined)
          splittedMesh.material = mesh.material[0];
        else splittedMesh.material = mesh.material[materialIndex];
      }

      if (center) this.utils.centerGeometryAndShiftMesh(splittedMesh);

      return splittedMesh;
    });
  }

  // Basic geometry manipulation tools

  public split(geometry: THREE.BufferGeometry): THREE.BufferGeometry[] {
    const groups = geometry.groups;
    const index = geometry.index && Array.from(geometry.index.array);
    const attributes = this.getAttributes(geometry);
    return groups.map((group) => this.assemble(group, attributes, index));
  }

  public splitByMaterialIndex(geometry: THREE.BufferGeometry) {
    const groups = geometry.groups;
    const materialIndexes = Array.from(
      new Set(groups.map((group) => group.materialIndex))
    );
    return materialIndexes.map((materialIndex) => {
      const groupIndexes = groups.reduce(
        (acc: number[], group, index) =>
          group.materialIndex === materialIndex ? acc.concat([index]) : acc,
        []
      );
      return this.splitByGroups(geometry, groupIndexes);
    });
  }

  public splitByGroups(
    geometry: THREE.BufferGeometry,
    groupIndexes: number[] | number
  ): THREE.BufferGeometry {
    const groups = geometry.groups;
    const index = geometry.index && Array.from(geometry.index.array);
    const attributes = this.getAttributes(geometry);

    if (!Array.isArray(groupIndexes))
      return this.assemble(groups[groupIndexes], attributes, index);

    if (index)
      return this.assembleByIndex(
        attributes,
        groupIndexes.reduce(
          (acc: number[], groupIndex: number) =>
            acc.concat(
              index.slice(
                groups[groupIndex].start,
                groups[groupIndex].start + groups[groupIndex].count
              )
            ),
          []
        )
      );

    return this.assembleByIndex(
      attributes,
      groupIndexes.reduce(
        (acc: number[], groupIndex: number) =>
          acc.concat(
            this.utils.getSortedIntegers(
              groups[groupIndex].count,
              groups[groupIndex].start
            )
          ),
        []
      )
    );
  }

  // Private methods

  private getAttributes(geometry: THREE.BufferGeometry) {
    return Object.fromEntries(
      this.utils.attributeProperties.map((property) => [
        property,
        {
          array: Array.from(geometry.attributes[property].array),
          itemSize: geometry.attributes[property].itemSize,
        },
      ])
    ) as Attributes;
  }

  private assemble(
    group: Group,
    attributes: Attributes,
    index: number[] | null
  ) {
    if (index)
      return this.assembleByIndex(
        attributes,
        index.slice(group.start, group.start + group.count)
      );

    const geometry = new this.BufferGeometry();

    this.utils.attributeProperties.forEach((property) => {
      const itemSize = attributes[property].itemSize;
      const array = attributes[property].array;
      const vertices = new Float32Array(
        array.slice(
          group.start * itemSize,
          (group.start + group.count) * itemSize
        )
      );
      geometry.setAttribute(
        property,
        new this.BufferAttribute(vertices, itemSize)
      );
    });

    return geometry;
  }

  private assembleByIndex(attributes: Attributes, index: number[]) {
    const geometry = new this.BufferGeometry();
    const uniqueIndex = Array.from(new Set(index)).sort((a, b) => a - b);

    if (uniqueIndex.length !== index.length) {
      const getMappedIndex = (i: number) =>
        uniqueIndex.findIndex((j) => i === j); // Inefficient
      const geoIndex = index.map((i: number) => getMappedIndex(i));
      geometry.setIndex(geoIndex);
    }

    this.utils.attributeProperties.forEach((property) => {
      const itemSize = attributes[property].itemSize;
      const array = attributes[property].array;
      const vertices = new Float32Array(uniqueIndex.length * itemSize);

      for (
        let i = 0, attrIndex = 0;
        i < uniqueIndex.length;
        i++, attrIndex += itemSize
      ) {
        const startingIndex = uniqueIndex[i] * itemSize;
        const arr = array.slice(startingIndex, startingIndex + itemSize);
        vertices.set(arr, attrIndex);
      }
      geometry.setAttribute(
        property,
        new this.BufferAttribute(vertices, itemSize)
      );
    });

    return geometry;
  }
}
