import { ExpoWebGLRenderingContext } from "expo-gl";
import { mat4, vec3 } from "gl-matrix";
import Node from "./Node";
import {
  createAndPopulateBuffer,
  createProgram,
  createShader,
  enableAndAttachBuffer,
} from "./Utility";

export default class CubeGemetry extends Node {
  width: number;
  height: number;
  depth: number;
  color: vec3;
  program: WebGLProgram | null;
  buffers: {
    position: WebGLBuffer;
    index: WebGLBuffer;
    color: WebGLBuffer;
  } | null;
  locations: {
    attributes: {
      position: number;
      color: number;
    };
    uniforms: {
      worldViewProjection: WebGLUniformLocation;
    };
  } | null;
  constructor(
    gl: ExpoWebGLRenderingContext,
    position?: vec3,
    width?: number,
    height?: number,
    depth?: number,
    color?: vec3
  ) {
    super(gl, position);
    this.width = width ? width : 1;
    this.height = height ? height : 1;
    this.depth = depth ? depth : 1;
    this.color = color ? color : vec3.fromValues(0, 0, 0);
    this.program = null;
    this.buffers = null;
    this.locations = null;
    this.init();
  }

  initProgram() {
    const vsSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;

            varying vec4 v_color;

            uniform mat4 u_worldViewProjection;
            
            
            void main() {
                vec4 position = u_worldViewProjection * a_position;

                gl_Position = position;
                v_color = a_color;
            }
        `;

    const fsSource = `
            precision mediump float;
            varying vec4 v_color;
    
            void main() {
                gl_FragColor = v_color;
            }
        `;

    const vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      fsSource
    );

    this.program = createProgram(this.gl, vertexShader, fragmentShader);
  }

  initBuffer() {
    const positions = [
      // Front face
      this.position[0] - this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] + this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] + this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] + this.depth / 2,
      this.position[0] - this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] + this.depth / 2,

      // Back face
      this.position[0] - this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] - this.depth / 2,
      this.position[0] - this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] - this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] - this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] - this.depth / 2,

      // Top face
      this.position[0] - this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] - this.depth / 2,
      this.position[0] - this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] + this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] + this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] - this.depth / 2,

      // Bottom face
      this.position[0] - this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] - this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] - this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] + this.depth / 2,
      this.position[0] - this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] + this.depth / 2,

      // Right face
      this.position[0] + this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] - this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] - this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] + this.depth / 2,
      this.position[0] + this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] + this.depth / 2,

      // Left face
      this.position[0] - this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] - this.depth / 2,
      this.position[0] - this.width / 2,
      this.position[1] - this.height / 2,
      this.position[2] + this.depth / 2,
      this.position[0] - this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] + this.depth / 2,
      this.position[0] - this.width / 2,
      this.position[1] + this.height / 2,
      this.position[2] - this.depth / 2,
    ];
    const colors = [
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
      ...this.color,
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

    const positionBuffer = createAndPopulateBuffer(
      this.gl,
      this.gl.ARRAY_BUFFER,
      new Float32Array(positions)
    );

    const colorBuffer = createAndPopulateBuffer(
      this.gl,
      this.gl.ARRAY_BUFFER,
      new Uint8Array(colors)
    );

    const indexBuffer = createAndPopulateBuffer(
      this.gl,
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices)
    );

    this.buffers = {
      color: colorBuffer,
      index: indexBuffer,
      position: positionBuffer,
    };
  }

  lookupLocation() {
    if (!this.program) {
      throw new Error("failed to lookup locations: no program available");
    }

    const positionAttribute = this.gl.getAttribLocation(
      this.program,
      "a_position"
    );

    const colorAttribute = this.gl.getAttribLocation(this.program, "a_color");

    const worldViewProjectionUniform = this.gl.getUniformLocation(
      this.program,
      "u_worldViewProjection"
    );

    if (
      !worldViewProjectionUniform ||
      colorAttribute < 0 ||
      positionAttribute < 0
    ) {
      throw new Error("failed to lookup location: unavailable");
    }

    this.locations = {
      attributes: {
        color: colorAttribute,
        position: positionAttribute,
      },
      uniforms: {
        worldViewProjection: worldViewProjectionUniform,
      },
    };
  }

  init() {
    this.initProgram();
    this.initBuffer();
    this.lookupLocation();
  }

  draw(parentMatrix: mat4) {
    if (!this.locations || !this.program || !this.buffers) {
      throw new Error("failed to draw");
    }

    this.gl.useProgram(this.program);

    const worldMatrix = mat4.create();
    mat4.multiply(worldMatrix, parentMatrix, this.localMatrix);

    enableAndAttachBuffer(
      this.gl,
      this.locations.attributes.position,
      this.gl.ARRAY_BUFFER,
      this.buffers.position,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    enableAndAttachBuffer(
      this.gl,
      this.locations.attributes.color,
      this.gl.ARRAY_BUFFER,
      this.buffers.color,
      3,
      this.gl.UNSIGNED_BYTE,
      true,
      0,
      0
    );

    this.gl.uniformMatrix4fv(
      this.locations.uniforms.worldViewProjection,
      false,
      worldMatrix
    );

    const primitiveType = this.gl.TRIANGLES;
    const drawOffset = 0;
    const count = 36;
    const type = this.gl.UNSIGNED_SHORT;
    this.gl.drawElements(primitiveType, count, type, drawOffset);

    this.children.forEach((child) => {
      child.draw(worldMatrix);
    });
  }
}
