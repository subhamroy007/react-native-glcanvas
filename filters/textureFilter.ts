import { Asset } from "expo-asset";
import { ExpoWebGLRenderingContext } from "expo-gl";
import { mat4 } from "gl-matrix";
import { FilterTransformParams } from "../utility/types";
import { webgl } from "./filter_utility";

export interface TextureFilterParams {
  width: number;
  height: number;
  x: number;
  y: number;
  gl: ExpoWebGLRenderingContext;
}

export interface TextureFilterDrawingParams {
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
    uniform sampler2D u_texture0;
    uniform sampler2D u_texture1;

    void main(void){
        gl_FragColor = texture2D(u_texture0, v_texcoord) - texture2D(u_texture1, v_texcoord);
    }
`;

function initBuffer(
  gl: ExpoWebGLRenderingContext,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const points = [
    x,
    y,
    0,
    x,
    y + height,
    0,
    x + width,
    y + height,
    0,
    x + width,
    y,
    0,
  ];

  const indices = [0, 1, 2, 0, 3, 2];

  const texturePoints = [0, 0, 0, 1, 1, 1, 1, 0];

  const pointBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const texturePointBuffer = gl.createBuffer();

  if (!pointBuffer || !indexBuffer || !texturePointBuffer) {
    throw new Error("cannot create buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, texturePointBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(texturePoints),
    gl.STATIC_DRAW
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return {
    points: pointBuffer,
    indices: indexBuffer,
    texturePoints: texturePointBuffer,
  };
}

export default function textureFilter({
  gl,
  height,
  width,
  x,
  y,
}: TextureFilterParams) {
  const vertexShader = webgl.createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = webgl.createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = webgl.createProgram(gl, vertexShader, fragmentShader);

  const buffer = initBuffer(gl, x, y, width, height);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");
  const texture0UniformLocation = gl.getUniformLocation(program, "u_texture0");
  const texture1UniformLocation = gl.getUniformLocation(program, "u_texture1");
  if (
    !matrixUniformLocation ||
    !texture0UniformLocation ||
    !texture1UniformLocation ||
    positionAttributeLocation < 0 ||
    texcoordLocation < 0
  ) {
    throw new Error("error occured while getting location");
  }

  //create a texture
  const texture0 = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture0);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 0, 0, 255])
  );

  const texture1 = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 255, 0, 255])
  );

  //load image asynchronously and replace with the current texture;
  const asset1 = Asset.fromModule(require("../assets/images/doctor1.jpg"));
  const asset2 = Asset.fromModule(require("../assets/images/avengers1.jpg"));
  (async () => {
    await asset1.downloadAsync();
    await asset2.downloadAsync();

    //load first texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      asset1 as any
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    //load second texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      asset2 as any
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  })();

  return ({
    transform: { rotation, scale, translation },
  }: TextureFilterDrawingParams) => {
    gl.useProgram(program);

    let projectionMatrix = mat4.create();

    // mat4.ortho(projectionMatrix, 0, WINDOW_WIDTH, WINDOW_HEIGHT, 0, -500, 500);

    mat4.perspective(
      projectionMatrix,
      (45 * Math.PI) / 180,
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

    gl.uniform1i(texture0UniformLocation, 0);
    gl.uniform1i(texture1UniformLocation, 1);

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
      buffer.texturePoints,
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
    const count = 6;
    const type = gl.UNSIGNED_SHORT;
    gl.drawElements(primitiveType, count, type, drawOffset);
  };
}
