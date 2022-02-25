import { ExpoWebGLRenderingContext } from "expo-gl";
import { mat4, vec3 } from "gl-matrix";
import { WINDOW_HEIGHT, WINDOW_WIDTH } from "../utility/constants";
import { FilterTransformParams } from "../utility/types";
import { filter, matrix, webgl } from "./filter_utility";

const vsSource = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    uniform mat4 u_matrix;
    varying vec4 v_color;


    void main(void){


      gl_Position = u_matrix * a_position;
      v_color = a_color;
    }
`;

const fsSource = `
    varying vec4 v_color;
    

    void main(void){
        gl_FragColor = v_color;
    }
`;

export interface SurfaceFilterRenderParams {
  transform: FilterTransformParams;
}

export interface SurfaceFilterInitParams {
  width: number;
  height: number;
  depth: number;
  x: number;
  y: number;
  z: number;
  gl: ExpoWebGLRenderingContext;
}

function generatePoints(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number
) {
  const p1 = vec3.fromValues(x, y, z);
  const p2 = vec3.fromValues(x + w, y, z);
  const p3 = vec3.fromValues(x + w, y, z + d);
  const p4 = vec3.fromValues(x, y, z + d);
  const p5 = vec3.fromValues(x, y + h, z + d);
  const p6 = vec3.fromValues(x, y + h, z);
  const p7 = vec3.fromValues(x + w, y + h, z);
  const p8 = vec3.fromValues(x + w, y + h, z + d);

  const frontFace = [...p5, ...p8, ...p3, ...p3, ...p4, ...p5];

  const backFace = [...p6, ...p1, ...p2, ...p2, ...p7, ...p6];

  const bottomFace = [...p1, ...p2, ...p3, ...p3, ...p4, ...p1];

  const topFace = [...p5, ...p6, ...p7, ...p7, ...p8, ...p5];

  const rightFace = [...p1, ...p4, ...p5, ...p5, ...p6, ...p1];

  const leftFace = [...p3, ...p2, ...p7, ...p7, ...p8, ...p3];

  return [
    ...frontFace,
    ...backFace,
    ...topFace,
    ...bottomFace,
    ...leftFace,
    ...rightFace,
  ];
}

function initBuffer(
  gl: ExpoWebGLRenderingContext,
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number
) {
  // const positions = [
  //   // left column front
  //   0, 0, 0, 0, 150, 0, 30, 0, 0, 0, 150, 0, 30, 150, 0, 30, 0, 0,

  //   // top rung front
  //   30, 0, 0, 30, 30, 0, 100, 0, 0, 30, 30, 0, 100, 30, 0, 100, 0, 0,

  //   // middle rung front
  //   30, 60, 0, 30, 90, 0, 67, 60, 0, 30, 90, 0, 67, 90, 0, 67, 60, 0,

  //   // left column back
  //   0, 0, 30, 30, 0, 30, 0, 150, 30, 0, 150, 30, 30, 0, 30, 30, 150, 30,

  //   // top rung back
  //   30, 0, 30, 100, 0, 30, 30, 30, 30, 30, 30, 30, 100, 0, 30, 100, 30, 30,

  //   // middle rung back
  //   30, 60, 30, 67, 60, 30, 30, 90, 30, 30, 90, 30, 67, 60, 30, 67, 90, 30,

  //   // top
  //   0, 0, 0, 100, 0, 0, 100, 0, 30, 0, 0, 0, 100, 0, 30, 0, 0, 30,

  //   // top rung right
  //   100, 0, 0, 100, 30, 0, 100, 30, 30, 100, 0, 0, 100, 30, 30, 100, 0, 30,

  //   // under top rung
  //   30, 30, 0, 30, 30, 30, 100, 30, 30, 30, 30, 0, 100, 30, 30, 100, 30, 0,

  //   // between top rung and middle
  //   30, 30, 0, 30, 60, 30, 30, 30, 30, 30, 30, 0, 30, 60, 0, 30, 60, 30,

  //   // top of middle rung
  //   30, 60, 0, 67, 60, 30, 30, 60, 30, 30, 60, 0, 67, 60, 0, 67, 60, 30,

  //   // right of middle rung
  //   67, 60, 0, 67, 90, 30, 67, 60, 30, 67, 60, 0, 67, 90, 0, 67, 90, 30,

  //   // bottom of middle rung.
  //   30, 90, 0, 30, 90, 30, 67, 90, 30, 30, 90, 0, 67, 90, 30, 67, 90, 0,

  //   // right of bottom
  //   30, 90, 0, 30, 150, 30, 30, 90, 30, 30, 90, 0, 30, 150, 0, 30, 150, 30,

  //   // bottom
  //   0, 150, 0, 0, 150, 30, 30, 150, 30, 0, 150, 0, 30, 150, 30, 30, 150, 0,

  //   // left side
  //   0, 0, 0, 0, 0, 30, 0, 150, 30, 0, 0, 0, 0, 150, 30, 0, 150, 0,
  // ];

  const positions = generatePoints(x, y, z, width, height, depth);

  // const colors = [
  //   // left column front
  //   200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200,
  //   70, 120,

  //   // top rung front
  //   200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200,
  //   70, 120,

  //   // middle rung front
  //   200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200,
  //   70, 120,

  //   // left column back
  //   80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70,
  //   200,

  //   // top rung back
  //   80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70,
  //   200,

  //   // middle rung back
  //   80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70,
  //   200,

  //   // top
  //   70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70,
  //   200, 210,

  //   // top rung right
  //   200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200,
  //   200, 70,

  //   // under top rung
  //   210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210,
  //   100, 70,

  //   // between top rung and middle
  //   210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70, 210,
  //   160, 70,

  //   // top of middle rung
  //   70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 70,
  //   180, 210,

  //   // right of middle rung
  //   100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100,
  //   70, 210,

  //   // bottom of middle rung.
  //   76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76,
  //   210, 100,

  //   // right of bottom
  //   140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140,
  //   210, 80,

  //   // bottom
  //   90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90,
  //   130, 110,

  //   // left side
  //   160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220,
  //   160, 160, 220,
  // ];
  const frontFaceColor = webgl.createColor();
  const backFaceColor = webgl.createColor();
  const topFaceColor = webgl.createColor();
  const bottomFaceColor = webgl.createColor();
  const leftFaceColor = webgl.createColor();
  const rightFaceColor = webgl.createColor();

  const colors = [
    ...frontFaceColor,
    ...frontFaceColor,
    ...frontFaceColor,
    ...frontFaceColor,
    ...frontFaceColor,
    ...frontFaceColor,
    ...backFaceColor,
    ...backFaceColor,
    ...backFaceColor,
    ...backFaceColor,
    ...backFaceColor,
    ...backFaceColor,
    ...topFaceColor,
    ...topFaceColor,
    ...topFaceColor,
    ...topFaceColor,
    ...topFaceColor,
    ...topFaceColor,
    ...bottomFaceColor,
    ...bottomFaceColor,
    ...bottomFaceColor,
    ...bottomFaceColor,
    ...bottomFaceColor,
    ...bottomFaceColor,
    ...leftFaceColor,
    ...leftFaceColor,
    ...leftFaceColor,
    ...leftFaceColor,
    ...leftFaceColor,
    ...leftFaceColor,
    ...rightFaceColor,
    ...rightFaceColor,
    ...rightFaceColor,
    ...rightFaceColor,
    ...rightFaceColor,
    ...rightFaceColor,
  ];

  const positionBuffer = gl.createBuffer();

  const colorBuffer = gl.createBuffer();

  if (!positionBuffer || !colorBuffer) {
    throw new Error("error occured while creating buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(colors), gl.STATIC_DRAW);

  return {
    positions: positionBuffer,
    colors: colorBuffer,
  };
}

export default function surfaceFilter({
  depth,
  height,
  width,
  x,
  y,
  z,
  gl,
}: SurfaceFilterInitParams) {
  const vertexShader = webgl.createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = webgl.createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = webgl.createProgram(gl, vertexShader, fragmentShader);

  const buffers = initBuffer(gl, width, height, depth, x, y, z);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const colorAttributeLocation = gl.getAttribLocation(program, "a_color");

  const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");

  if (
    !matrixUniformLocation ||
    positionAttributeLocation < 0 ||
    colorAttributeLocation < 0
  ) {
    throw new Error("error occured while getting location");
  }

  return ({
    transform: { rotation, scale, translation },
  }: SurfaceFilterRenderParams) => {
    gl.useProgram(program);

    let targetMatrix = mat4.create();

    mat4.ortho(targetMatrix, 0, WINDOW_WIDTH, WINDOW_HEIGHT, 0, -500, 500);

    // mat4.perspective(
    //   targetMatrix,
    //   (75 * Math.PI) / 180,
    //   gl.drawingBufferWidth / gl.drawingBufferHeight,
    //   0.1,
    //   1000
    // );

    mat4.translate(targetMatrix, targetMatrix, [
      translation.x,
      translation.y,
      translation.z,
    ]);

    mat4.rotateX(targetMatrix, targetMatrix, (rotation.x * Math.PI) / 180);

    mat4.rotateY(targetMatrix, targetMatrix, (rotation.y * Math.PI) / 180);

    mat4.rotateZ(targetMatrix, targetMatrix, (rotation.z * Math.PI) / 180);

    mat4.scale(targetMatrix, targetMatrix, [scale.x, scale.y, scale.z]);

    gl.uniformMatrix4fv(matrixUniformLocation, false, targetMatrix);

    gl.enableVertexAttribArray(positionAttributeLocation);
    webgl.bindAttributeWithBuffer(
      gl,
      buffers.positions,
      positionAttributeLocation,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.enableVertexAttribArray(colorAttributeLocation);

    webgl.bindAttributeWithBuffer(
      gl,
      buffers.colors,
      colorAttributeLocation,
      3,
      gl.UNSIGNED_BYTE,
      true,
      0,
      0
    );

    const primitiveType = gl.TRIANGLES;
    const drawOffset = 0;
    const count = 36;
    gl.drawArrays(primitiveType, drawOffset, count);
  };
}
