import { ExpoWebGLRenderingContext } from "expo-gl";
import { webgl } from "./filter_utility";

const vsSource = `
  attribute vec4 a_position;
  attribute float a_brightness;
 
  varying float v_brightness;

  void main() {
 
    gl_Position = a_position;
    v_brightness = a_brightness;
  }
`;

const fsSource = `
  precision mediump float;
  varying float v_brightness;
  void main() {
    gl_FragColor = vec4( fract(v_brightness * 10.0), 0, 0, 1);
  }
`;

function initBuffer(gl: ExpoWebGLRenderingContext) {
  const mult = 10;
  const points = [
    -0.8,
    0.8,
    0,
    1, // 1st rect 1st triangle
    0.8,
    0.8,
    0,
    1,
    -0.8,
    0.2,
    0,
    1,
    -0.8,
    0.2,
    0,
    1, // 1st rect 2nd triangle
    0.8,
    0.8,
    0,
    1,
    0.8,
    0.2,
    0,
    1,

    -0.8,
    -0.2,
    0,
    1, // 2nd rect 1st triangle
    0.8 * mult,
    -0.2 * mult,
    0,
    mult,
    -0.8,
    -0.8,
    0,
    1,
    -0.8,
    -0.8,
    0,
    1, // 2nd rect 2nd triangle
    0.8 * mult,
    -0.2 * mult,
    0,
    mult,
    0.8 * mult,
    -0.8 * mult,
    0,
    mult,
  ];

  const brightness = [
    0, // 1st rect 1st triangle
    1,
    0,
    0, // 1st rect 2nd triangle
    1,
    1,

    0, // 2nd rect 1st triangle
    1,
    0,
    0, // 2nd rect 2nd triangle
    1,
    1,
  ];

  const pointBuffer = gl.createBuffer();

  let brightnessBuffer = gl.createBuffer();

  if (!pointBuffer || !brightnessBuffer) {
    throw new Error("cannot create buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brightness), gl.STATIC_DRAW);
  return {
    points: pointBuffer,
    brightness: brightnessBuffer,
    // indices: indexBuffer,
    // texturePoints: texturePointBuffer,
  };
}

export function basicFilter(gl: ExpoWebGLRenderingContext) {
  const vertexShader = webgl.createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = webgl.createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = webgl.createProgram(gl, vertexShader, fragmentShader);

  const buffer = initBuffer(gl);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const brightnessAttributeLocation = gl.getAttribLocation(
    program,
    "a_brightness"
  );

  if (positionAttributeLocation < 0 || brightnessAttributeLocation < 0) {
    throw new Error("error occured while getting location");
  }

  return () => {
    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);
    webgl.bindAttributeWithBuffer(
      gl,
      buffer.points,
      positionAttributeLocation,
      4,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.enableVertexAttribArray(brightnessAttributeLocation);
    webgl.bindAttributeWithBuffer(
      gl,
      buffer.brightness,
      brightnessAttributeLocation,
      1,
      gl.FLOAT,
      false,
      0,
      0
    );

    const primitiveType = gl.TRIANGLES;
    const drawOffset = 0;
    const count = 12;
    gl.drawArrays(primitiveType, drawOffset, count);
  };
}
