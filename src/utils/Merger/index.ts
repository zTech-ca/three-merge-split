import * as THREE from "three";
import { ThreeUtils } from "../index";
import {
  AttributeProperty,
  Attribute,
  Group,
  AttributesFull,
  AttributeFull,
} from "../../types";

interface AttributesExtended extends AttributesFull {
  nextIndex: number | null;
  nextMaterialIndex: number | null;
}

interface MeshAndTransformationReferenceUuid {
  mesh: THREE.Mesh;
  transformationReferenceUuid?: string;
}

export class Merger {
  // Public methods available to users

  // High-level geometry manipulation tools

  public static mergeMeshes(
    meshData: THREE.Mesh[] | MeshAndTransformationReferenceUuid[],
    center = false,
    useGroups = true,
    useIndex = true
  ) {
    if (!meshData.length) return null;

    let mergedMesh: THREE.Mesh;
    let meshes: THREE.Mesh[];

    if (meshData[0] instanceof THREE.Mesh) {
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
        ThreeUtils.applyTransforms(
          dat.mesh.geometry.clone(),
          dat.transformationReferenceUuid
            ? ThreeUtils.getAncestralTransformations(
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
    if (center) ThreeUtils.centerGeometryAndShiftMesh(mergedMesh);

    mergedMesh.material = useGroups
      ? this.sortMaterials(meshes)
      : ThreeUtils.getFirstMaterial(meshes[0]);

    return mergedMesh;
  }

  // Basic geometry manipulation tools

  public static merge(
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

  private static mergeAttribtues(
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
            localIndex = ThreeUtils.getSortedIntegers(
              localCount,
              localNextIndex!
            );
            nextIndex = localNextIndex! + localCount;
          }
        } else {
          localIndex = null;
          nextIndex = null;
        }

        return ThreeUtils.attributeProperties.reduce(
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
          ThreeUtils.attributeProperties.map((property) => [
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

  private static getAttributes(geometry: THREE.BufferGeometry) {
    return {
      index: geometry.index ? Array.from(geometry.index.array) : null,
      groups: geometry.groups,
      attributes: Object.fromEntries(
        ThreeUtils.attributeProperties.map((property) => [
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

  private static areConsistent(
    fullAttributes: Record<AttributeProperty, AttributeFull>[]
  ) {
    if (
      ThreeUtils.attributeProperties.some((property) =>
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

  private static assemble(attributes: AttributesFull) {
    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(attributes.index);
    geometry.groups = attributes.groups;
    ThreeUtils.attributeProperties.forEach((property) =>
      geometry.setAttribute(
        property,
        new THREE.BufferAttribute(
          new Float32Array(attributes.attributes[property].array),
          attributes.attributes[property].itemSize
        )
      )
    );
    return geometry;
  }

  private static spreadIndex(attribute: Attribute, index: number[]) {
    let array: number[] = [];
    index.forEach((i) => {
      let ix = i * attribute.itemSize;
      array.push(...attribute.array.slice(ix, ix + attribute.itemSize));
    });
    return array;
  }

  private static sortMaterials(meshes: THREE.Mesh[]) {
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
                ThreeUtils.getFirstMaterial(mesh)
            );
        else
          while (pendingMaterials.length < highestMaterialIndex + 1)
            pendingMaterials.push(mesh.material);
      } else {
        pendingMaterials = [ThreeUtils.getFirstMaterial(mesh)];
      }
      return acc.concat(pendingMaterials);
    }, []);
  }
}
