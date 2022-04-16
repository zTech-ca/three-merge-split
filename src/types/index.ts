export enum AttributeProperty {
  normal = "normal",
  position = "position",
  uv = "uv",
}

export interface Attribute {
  array: number[];
  itemSize: number;
}

export type Attributes = Record<AttributeProperty, Attribute>;

export interface AttributeFull extends Attribute {
  count: number;
}

export type AttributesFull = {
  attributes: Record<AttributeProperty, AttributeFull>;
  index: number[] | null;
  groups: Group[];
};

export interface Group {
  start: number;
  count: number;
  materialIndex?: number;
}
