import { ExpoWebGLRenderingContext } from "expo-gl";
import { vec3, vec4 } from "gl-matrix";
import { Color } from "../utility/types";

const webgl = {
  createShader: function (
    gl: ExpoWebGLRenderingContext,
    type: number,
    source: string
  ) {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("error occured while creating shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const isSuccess = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!isSuccess) {
      gl.deleteShader(shader);
      throw new Error("error occured while compiling shader");
    }

    return shader;
  },
  createProgram: function (
    gl: ExpoWebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) {
    const program = gl.createProgram();
    if (!program) {
      throw new Error("error occured while creating program");
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const isSuccess = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!isSuccess) {
      gl.deleteProgram(program);
      throw new Error("error occured while linking program");
    }

    return program;
  },
  createColor: function () {
    return vec3.fromValues(
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256)
    );
  },
  bindAttributeWithBuffer: function (
    gl: ExpoWebGLRenderingContext,
    buffer: WebGLBuffer,
    location: number,
    size: number,
    type: number,
    normalize: boolean,
    stride: number,
    offset: number
  ) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.vertexAttribPointer(location, size, type, normalize, stride, offset);
  },
};

const filter = {
  identity: function (size: number) {
    let result: number[] = [];

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if ((i * size + j) % (size + 1) === 0) {
          result.push(1);
        } else {
          result.push(0);
        }
      }
    }

    return result;
  },

  zeros: function (size: number) {
    let result: number[] = [];

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        result.push(0);
      }
    }

    return result;
  },

  translation: function (tx: number, ty: number, tz: number) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1];
  },

  xRotation: function (angleInRadians: number) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);

    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  },
  yRotation: function (angleInRadians: number) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);

    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  },

  zRotation: function (angleInRadians: number) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);

    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  },

  scaling: function (sx: number, sy: number, sz: number) {
    return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
  },

  orthographic: function (
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
  ) {
    return [
      2 / (right - left),
      0,
      0,
      0,
      0,
      2 / (top - bottom),
      0,
      0,
      0,
      0,
      2 / (near - far),
      0,

      (left + right) / (left - right),
      (bottom + top) / (bottom - top),
      (near + far) / (near - far),
      1,
    ];
  },
};

const matrix = {
  multiply: function (mat1: number[], mat2: number[], deg: number) {
    const result: number[] = [];
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) {
        let cell = 0;
        for (let k = 0; k < deg; k++) {
          cell += mat1[i * deg + k] * mat2[k * deg + j];
        }
        result.push(cell);
      }
    }
    return result;
  },

  add: function (mat1: number[], mat2: number[], deg: number) {
    const result: number[] = [];
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) {
        let cell = 0;
        cell = mat1[i * deg + j] + mat2[i * deg + j];
        result.push(cell);
      }
    }
    return result;
  },

  translate: function (source: number[], tx: number, ty: number, tz: number) {
    return matrix.multiply(source, filter.translation(tx, ty, tz), 4);
  },

  xRotate: function (source: number[], angleInRadians: number) {
    return matrix.multiply(source, filter.xRotation(angleInRadians), 4);
  },

  yRotate: function (source: number[], angleInRadians: number) {
    return matrix.multiply(source, filter.yRotation(angleInRadians), 4);
  },

  zRotate: function (source: number[], angleInRadians: number) {
    return matrix.multiply(source, filter.zRotation(angleInRadians), 4);
  },

  scale: function (source: number[], sx: number, sy: number, sz: number) {
    return matrix.multiply(source, filter.scaling(sx, sy, sz), 4);
  },
};

export { webgl, filter, matrix };
