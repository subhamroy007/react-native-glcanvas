import { ExpoWebGLRenderingContext } from "expo-gl";

export interface Color {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export interface GradientRectangleFilterParams {
  gl: ExpoWebGLRenderingContext;
  x: number;
  y: number;
  width: number;
  height: number;
  gradient: { start: Color; end: Color };
}

export interface AppCanvasProps {}

export interface AppCanvasState {}

export type BufferMap = {
  [key: string]: WebGLBuffer | null;
};

export type AttributeLocationMap = {
  [key: string]: number | null;
};

export type UniformLocationMap = {
  [key: string]: WebGLUniformLocation | null;
};

export interface FilterTransformParams {
  translation: {
    x: number;
    y: number;
    z: number;
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}
