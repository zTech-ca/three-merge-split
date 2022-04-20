import * as THREE from "three";
import { ThreeUtils } from "../ThreeUtils";
import {
  AttributeProperty,
  Attribute,
  Group,
  AttributesFull,
  AttributeFull,
} from "../types";

interface AttributesExtended extends AttributesFull {
  nextIndex: number | null;
  nextMaterialIndex: number | null;
}

interface MeshAndTransformationReferenceUuid {
  mesh: THREE.Mesh;
  transformationReferenceUuid?: string;
}

export class Merger {
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
   * This merges all of the meshes passed in as an array. Optionally, users may
   * center the geometry while keeping the relative global position of geometries, and
   * choose to create groups within the merged geometries, where each of the group
   * in each geometry is combined. Any geometry without group will have that entire
   * geometry portion as one group. Users may also choose to use index if any of the
   * passed geometry has 2 or more same indices.
   * @param meshData is either an array of mesh or an array of
   * MeshAndTransformationReferenceUuid, which has 2 properties: the mesh and
   * transformationReferenceUuid, which is the uuid of one of ancestors of the mesh.
   * Using this ancestor, the geometry is shifted based on all of the transformations
   * down to the mesh's hierarchy.
   * @param center is true if users choose to center
   * @param useGroups is true if users wish to generate groups in the merged geometry.
   * @param useIndex is true if users wish to keep all of the indices in geometries if
   * relevant.
   * @returns merged mesh.
   */

  public mergeMeshes(
    meshData: THREE.Mesh[] | MeshAndTransformationReferenceUuid[],
    center = false,
    useGroups = true,
    useIndex = true
  ) {
    if (!meshData.length) return null;

    let mergedMesh: THREE.Mesh;
    let meshes: THREE.Mesh[];

    if ("isMesh" in meshData[0] && meshData[0].isMesh) {
      meshes = meshData as THREE.Mesh[];
      const mergedGeometry = this.merge(
        meshes.map((mesh) => mesh.geometry.clone()),
        useGroups,
        useIndex
      );
      if (!mergedGeometry) return null;
      mergedMesh = meshes[0].clone();
      mergedMesh.geometry = mergedGeometry;
    } else {
      const data = meshData as MeshAndTransformationReferenceUuid[];
      meshes = data.map((dat) => dat.mesh);
      const geometries = data.map((dat) =>
        this.utils.applyTransforms(
          dat.mesh.geometry.clone(),
          dat.transformationReferenceUuid
            ? this.utils.getAncestralTransformations(
                dat.mesh,
                dat.transformationReferenceUuid
              )
            : []
        )
      );
      const mergedGeometry = this.merge(geometries, useGroups, useIndex);
      if (!mergedGeometry) return null;
      mergedMesh = data[0].mesh.clone();
      mergedMesh.geometry = mergedGeometry;
    }
    if (center) this.utils.centerGeometryAndShiftMesh(mergedMesh);

    mergedMesh.material = useGroups
      ? this.sortMaterials(meshes)
      : this.utils.getFirstMaterial(meshes[0]);

    return mergedMesh;
  }

  // Basic geometry manipulation tools

  /**
   * This merges all of the geometries passed in as an array. Optionally, user may
   * choose to create groups within the merged geometries, where each of the group
   * in each geometry is combined. Any geometry without group will have that entire
   * geometry portion as one group. Users may also choose to use index if any of the
   * passed geometry has 2 or more same indices.
   * @param geometries to be merged.
   * @param useGroups is true if users wish to generate groups in the merged geometry.
   * @param useIndex is true if users wish to keep all of the indices in geometries if
   * relevant.
   * @returns merged geometry.
   */

  public merge(
    geometries: THREE.BufferGeometry[],
    useGroups = true,
    useIndex = true
  ) {
    if (!geometries.length) return null;
    const attributes = geometries.map((geometry) =>
      this.getAttributes(geometry)
    );
    if (!this.areConsistent(attributes.map((attr) => attr.attributes)))
      return null;
    return this.assemble(this.mergeAttribtues(attributes, useGroups, useIndex));
  }

  // Private helpers

  private mergeAttribtues(
    attributes: AttributesFull[],
    useGroups: boolean,
    useIndex: boolean
  ) {
    const indexMatters = useIndex
      ? attributes.some(
          ({ index }) => index && new Set(index).size !== index.length
        )
      : false;

    return attributes.reduce(
      (acc: AttributesExtended, attribute) => {
        let nextMaterialIndex: number | null = null;
        let localGroups: Group[] = [];
        if (useGroups) {
          const accCount = acc.index
            ? acc.index.length
            : acc.attributes[AttributeProperty.normal].count;

          if (attribute.groups.length)
            localGroups = attribute.groups.map((group) => {
              return {
                ...group,
                start: group.start + accCount,
                materialIndex:
                  group.materialIndex === undefined
                    ? 0
                    : group.materialIndex + acc.nextMaterialIndex!,
              };
            });
          else
            localGroups = [
              {
                start: accCount,
                count: attribute.index
                  ? attribute.index.length
                  : attribute.attributes[AttributeProperty.normal].count,
                materialIndex: acc.nextMaterialIndex!,
              },
            ];

          nextMaterialIndex =
            Math.max(
              ...(localGroups.map((group) => group.materialIndex) as number[])
            ) + 1;
        }

        const spreadIndex = !indexMatters && attribute.index;
        const localCount = spreadIndex
          ? attribute.index!.length
          : attribute.attributes[AttributeProperty.normal].count;
        const localNextIndex = acc.nextIndex;
        let localIndex: number[] | null, nextIndex: number | null;

        if (indexMatters) {
          if (attribute.index) {
            localIndex = attribute.index.map((i) => i + localNextIndex!);
            nextIndex = Math.max(...localIndex) + 1;
          } else {
            localIndex = this.utils.getSortedIntegers(
              localCount,
              localNextIndex!
            );
            nextIndex = localNextIndex! + localCount;
          }
        } else {
          localIndex = null;
          nextIndex = null;
        }

        return this.utils.attributeProperties.reduce(
          (acc_, property) => {
            const { array: accArray, count: accAccount } =
              acc_.attributes[property];
            const localAttr = attribute.attributes[property];
            const localPropertyArray = spreadIndex
              ? this.spreadIndex(localAttr, attribute.index!)
              : localAttr.array;

            return {
              ...acc_,
              attributes: {
                ...acc_.attributes,
                [property]: {
                  ...acc_.attributes[property],
                  array: accArray.concat(localPropertyArray),
                  count: accAccount + localCount,
                },
              },
            };
          },
          {
            ...acc,
            index: indexMatters ? acc.index!.concat(localIndex!) : null,
            nextIndex,
            nextMaterialIndex,
            groups: acc.groups.concat(localGroups),
          }
        );
      },
      {
        index: indexMatters ? [] : null,
        nextIndex: indexMatters ? 0 : null,
        nextMaterialIndex: useGroups ? 0 : null,
        groups: [] as Group[],
        attributes: Object.fromEntries(
          this.utils.attributeProperties.map((property) => [
            property,
            {
              array: [] as number[],
              itemSize: attributes[0].attributes[property].itemSize,
              count: 0,
            },
          ])
        ),
      } as AttributesExtended
    );
  }

  private getAttributes(geometry: THREE.BufferGeometry) {
    return {
      index: geometry.index ? Array.from(geometry.index.array) : null,
      groups: geometry.groups,
      attributes: Object.fromEntries(
        this.utils.attributeProperties.map((property) => [
          property,
          {
            array: Array.from(geometry.attributes[property].array),
            itemSize: geometry.attributes[property].itemSize,
            count: geometry.attributes[property].count,
          },
        ])
      ),
    } as AttributesFull;
  }

  private areConsistent(
    fullAttributes: Record<AttributeProperty, AttributeFull>[]
  ) {
    if (
      this.utils.attributeProperties.some((property) =>
        fullAttributes
          .slice(1)
          .some(
            (fullAttribute) =>
              fullAttribute[property].itemSize !==
              fullAttributes[0][property].itemSize
          )
      )
    )
      return false;

    if (
      fullAttributes.some((fullAttribute) => {
        const normalCount = fullAttribute[AttributeProperty.normal].count;
        return (
          normalCount !== fullAttribute[AttributeProperty.position].count ||
          normalCount !== fullAttribute[AttributeProperty.uv].count
        );
      })
    )
      return false;

    return true;
  }

  private assemble(attributes: AttributesFull) {
    const geometry = new this.BufferGeometry();
    geometry.setIndex(attributes.index);
    geometry.groups = attributes.groups;
    this.utils.attributeProperties.forEach((property) =>
      geometry.setAttribute(
        property,
        new this.BufferAttribute(
          new Float32Array(attributes.attributes[property].array),
          attributes.attributes[property].itemSize
        )
      )
    );
    return geometry;
  }

  private spreadIndex(attribute: Attribute, index: number[]) {
    let array: number[] = [];
    index.forEach((i) => {
      let ix = i * attribute.itemSize;
      array.push(...attribute.array.slice(ix, ix + attribute.itemSize));
    });
    return array;
  }

  private sortMaterials(meshes: THREE.Mesh[]) {
    return meshes.reduce((acc: THREE.Material[], mesh) => {
      let pendingMaterials: THREE.Material[] = [];

      if (mesh.geometry.groups.length) {
        const highestMaterialIndex = Math.max(
          ...(mesh.geometry.groups.map(
            (group) => group.materialIndex || 0
          ) as number[])
        );

        if (Array.isArray(mesh.material))
          while (pendingMaterials.length < highestMaterialIndex + 1)
            pendingMaterials.push(
              mesh.material[pendingMaterials.length] ||
                this.utils.getFirstMaterial(mesh)
            );
        else
          while (pendingMaterials.length < highestMaterialIndex + 1)
            pendingMaterials.push(mesh.material);
      } else {
        pendingMaterials = [this.utils.getFirstMaterial(mesh)];
      }
      return acc.concat(pendingMaterials);
    }, []);
  }
}
