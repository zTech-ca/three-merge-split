import * as THREE from "three";
import { ThreeUtils } from "../index";

enum AttributeProperty {
  normal = "normal",
  position = "position",
  uv = "uv",
}

interface Attribute {
  array: number[];
  itemSize: number;
}

type Attributes = Record<AttributeProperty, Attribute>;

interface Group {
  start: number;
  count: number;
  materialIndex?: number;
}

export class Splitter {
  // Public methods available to users

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

  public static splitMesh(
    mesh: THREE.Mesh,
    center = false,
    transformationReferenceUuid?: string
  ) {
    const geometries = this.split(mesh.geometry);
    const transformations = transformationReferenceUuid
      ? ThreeUtils.getAncestralTransformations(
          mesh,
          transformationReferenceUuid
        )
      : null;

    return geometries.map((geometry, i) => {
      const splittedMesh = mesh.clone();
      splittedMesh.geometry = geometry;

      if (transformations)
        transformations.forEach((transformation) =>
          geometry.applyMatrix4(transformation)
        );

      if (Array.isArray(mesh.material)) {
        const materialIndex = mesh.geometry.groups[i].materialIndex;
        if (materialIndex === undefined)
          splittedMesh.material = mesh.material[0];
        else splittedMesh.material = mesh.material[materialIndex];
      }

      if (center) ThreeUtils.centerGeometryAndShiftMesh(splittedMesh);

      return splittedMesh;
    });
  }

  // Basic geometry manipulation tools

  public static split(geometry: THREE.BufferGeometry): THREE.BufferGeometry[] {
    const groups = geometry.groups;
    const index = geometry.index && Array.from(geometry.index.array);
    const attributes = this.getAttributes(geometry);
    return groups.map((group) => this.assemble(group, attributes, index));
  }

  public static splitByMaterialIndex(geometry: THREE.BufferGeometry) {
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

  public static splitByGroups(
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
            Array.from(
              { length: groups[groupIndex].count },
              (_, i) => i + groups[groupIndex].start
            )
          ),
        []
      )
    );
  }

  // Private methods

  private static getAttributes(geometry: THREE.BufferGeometry): Attributes {
    const attributes = geometry.attributes;
    return {
      normal: {
        array: Array.from(attributes.normal.array),
        itemSize: attributes.normal.itemSize,
      },
      position: {
        array: Array.from(attributes.position.array),
        itemSize: attributes.position.itemSize,
      },
      uv: {
        array: Array.from(attributes.uv.array),
        itemSize: attributes.uv.itemSize,
      },
    };
  }

  private static assemble(
    group: Group,
    attributes: Attributes,
    index: number[] | null
  ) {
    if (index)
      return this.assembleByIndex(
        attributes,
        index.slice(group.start, group.start + group.count)
      );

    const geometry = new THREE.BufferGeometry();

    this.attributeProperties.forEach((property) => {
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
        new THREE.BufferAttribute(vertices, itemSize)
      );
    });

    return geometry;
  }

  private static assembleByIndex(attributes: Attributes, index: number[]) {
    const geometry = new THREE.BufferGeometry();
    const uniqueIndex = Array.from(new Set(index)).sort((a, b) => a - b);

    if (uniqueIndex.length !== index.length) {
      const getMappedIndex = (i: number) =>
        uniqueIndex.findIndex((j) => i === j); // Inefficient
      const geoIndex = index.map((i: number) => getMappedIndex(i));
      geometry.setIndex(geoIndex);
    }

    this.attributeProperties.forEach((property) => {
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
        new THREE.BufferAttribute(vertices, itemSize)
      );
    });

    return geometry;
  }

  private static get attributeProperties() {
    return Object.keys(AttributeProperty) as AttributeProperty[];
  }
}
