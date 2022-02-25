import { ExpoWebGLRenderingContext } from "expo-gl";

export function createShader(
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
}

export function createProgram(
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
}

export function createAndPopulateBuffer(
  gl: ExpoWebGLRenderingContext,
  bindingPoint: number,
  data: ArrayBufferView
) {
  const buffer = gl.createBuffer();

  if (!buffer) {
    throw new Error("failed to init buffer");
  }

  gl.bindBuffer(bindingPoint, buffer);

  gl.bufferData(bindingPoint, data, gl.STATIC_DRAW);

  return buffer;
}

export function enableAndAttachBuffer(
  gl: ExpoWebGLRenderingContext,
  attribute: number,
  bindingPoint: number,
  buffer: WebGLBuffer,
  noOfComponents: number,
  type: number,
  normalize: boolean,
  offset: number,
  stride: number
) {
  gl.enableVertexAttribArray(attribute);
  gl.bindBuffer(bindingPoint, buffer);
  gl.vertexAttribPointer(
    attribute,
    noOfComponents,
    type,
    normalize,
    stride,
    offset
  );
}
