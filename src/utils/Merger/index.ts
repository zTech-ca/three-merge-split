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

export class Merger {
  // Public methods available to users

  // High-level geometry manipulation tools

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
          localGroups = attribute.groups.map((group) => {
            const accCount = acc.index
              ? acc.index.length
              : acc.attributes[AttributeProperty.normal].count;
            return {
              ...group,
              start: group.start + accCount,
              materialIndex:
                group.materialIndex === undefined
                  ? undefined
                  : group.materialIndex + acc.nextMaterialIndex!,
            };
          });

          nextMaterialIndex =
            Math.max(
              ...(localGroups
                .filter((group) => group.materialIndex !== undefined)
                .map((group) => group.materialIndex) as number[])
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
}
