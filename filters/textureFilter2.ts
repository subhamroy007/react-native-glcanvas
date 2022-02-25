import { Asset } from "expo-asset";
import { ExpoWebGLRenderingContext } from "expo-gl";
import { mat4 } from "gl-matrix";
import { FilterTransformParams } from "../utility/types";
import { webgl } from "./filter_utility";

export interface TextureFilter2Params {
  gl: ExpoWebGLRenderingContext;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

export interface TextureFilter2DrawingParams {
  transform: FilterTransformParams;
}

const vsSource = `

    attribute vec4 a_position;
    attribute vec2 a_texcoord;
    uniform mat4 u_matrix;

    varying vec2 v_texcoord;

    void main(void){


      gl_Position = u_matrix * a_position;
      v_texcoord = a_texcoord;
    }
`;

const fsSource = `
    varying vec2 v_texcoord;
    uniform sampler2D u_texture;

    void main(void){
        gl_FragColor = texture2D(u_texture, v_texcoord);
    }
`;

function initBuffer(
  gl: ExpoWebGLRenderingContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number
) {
  const points = [
    x,
    y,
    z,
    x,
    y + h,
    z,
    x + w,
    y + h,
    z,
    x + w,
    y,
    z,
    x,
    y,
    z + d,
    x,
    y + h,
    z + d,
    x + w,
    y + h,
    z + d,
    x + w,
    y,
    z + d,
    x,
    y,
    z + d,
    x,
    y + h,
    z + d,
    x,
    y + h,
    z,
    x,
    y,
    z,
    x + w,
    y,
    z + d,
    x + w,
    y + h,
    z + d,
    x + w,
    y + h,
    z,
    x + w,
    y,
    z,
    x + w,
    y,
    z,
    x,
    y,
    z,
    x + w,
    y,
    z,
    x + w,
    y,
    z + d,
    x + w,
    y + h,
    z,
    x,
    y + h,
    z,
    x + w,
    y + h,
    z,
    x + w,
    y + h,
    z + d,
  ];

  const indices = [
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23, // left
  ];

  //   const texture = [
  //     0,
  //     0,
  //     0,
  //     1,
  //     1 / 6,
  //     1,
  //     1 / 6,
  //     0,
  //     1 / 6,
  //     0,
  //     1 / 6,
  //     1,
  //     2 / 6,
  //     1,
  //     2 / 6,
  //     0,
  //     2 / 6,
  //     0,
  //     2 / 6,
  //     1,
  //     3 / 6,
  //     1,
  //     3 / 6,
  //     0,
  //     3 / 6,
  //     0,
  //     3 / 6,
  //     1,
  //     4 / 6,
  //     1,
  //     4 / 6,
  //     0,
  //     4 / 6,
  //     0,
  //     4 / 6,
  //     1,
  //     5 / 6,
  //     1,
  //     5 / 6,
  //     0,
  //     5 / 6,
  //     0,
  //     5 / 6,
  //     1,
  //     1,
  //     1,
  //     1,
  //     0,
  //   ];

  const texture = [
    0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0,
    0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0,
  ];

  const pointBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const textureBuffer = gl.createBuffer();

  if (!pointBuffer || !indexBuffer || !textureBuffer) {
    throw new Error("error creating buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return {
    points: pointBuffer,
    indices: indexBuffer,
    texture: textureBuffer,
  };
}

export default function textureFilter2({
  d,
  gl,
  h,
  w,
  x,
  y,
  z,
}: TextureFilter2Params) {
  const vertexShader = webgl.createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = webgl.createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = webgl.createProgram(gl, vertexShader, fragmentShader);

  const buffer = initBuffer(gl, x, y, z, w, h, d);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");
  const textureUniformLocation = gl.getUniformLocation(program, "u_texture");
  if (
    !matrixUniformLocation ||
    !textureUniformLocation ||
    positionAttributeLocation < 0 ||
    texcoordLocation < 0
  ) {
    throw new Error("error occured while getting location");
  }

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    3,
    2,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([128, 64, 128, 30, 192, 90])
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  //load image asynchronously and replace with the current texture;
  //   const asset = Asset.fromModule(require("../assets/images/img6.png"));
  //   asset.downloadAsync().then((result) => {
  //     gl.activeTexture(gl.TEXTURE0);
  //     gl.bindTexture(gl.TEXTURE_2D, texture);

  //     gl.texImage2D(
  //       gl.TEXTURE_2D,
  //       0,
  //       gl.RGBA,
  //       gl.RGBA,
  //       gl.UNSIGNED_BYTE,
  //       result as any
  //     );

  //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  //   });
  return ({
    transform: { rotation, scale, translation },
  }: TextureFilter2DrawingParams) => {
    gl.useProgram(program);

    let projectionMatrix = mat4.create();

    mat4.perspective(
      projectionMatrix,
      (75 * Math.PI) / 180,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );

    mat4.translate(projectionMatrix, projectionMatrix, [
      translation.x,
      translation.y,
      translation.z,
    ]);

    mat4.rotateX(
      projectionMatrix,
      projectionMatrix,
      (rotation.x * Math.PI) / 180
    );

    mat4.rotateY(
      projectionMatrix,
      projectionMatrix,
      (rotation.y * Math.PI) / 180
    );

    mat4.rotateZ(
      projectionMatrix,
      projectionMatrix,
      (rotation.z * Math.PI) / 180
    );

    mat4.scale(projectionMatrix, projectionMatrix, [scale.x, scale.y, scale.z]);

    gl.uniformMatrix4fv(matrixUniformLocation, false, projectionMatrix);

    gl.uniform1i(textureUniformLocation, 0);

    gl.enableVertexAttribArray(positionAttributeLocation);
    webgl.bindAttributeWithBuffer(
      gl,
      buffer.points,
      positionAttributeLocation,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.enableVertexAttribArray(texcoordLocation);
    webgl.bindAttributeWithBuffer(
      gl,
      buffer.texture,
      texcoordLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);

    const primitiveType = gl.TRIANGLES;
    const drawOffset = 0;
    const count = 36;
    const type = gl.UNSIGNED_SHORT;
    gl.drawElements(primitiveType, count, type, drawOffset);
  };
}
