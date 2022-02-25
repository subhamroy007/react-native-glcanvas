import { ExpoWebGLRenderingContext } from "expo-gl";
import { mat4, vec3 } from "gl-matrix";

const vsSource = `
    attribute vec4 a_position;
    attribute vec3 a_normal;
    attribute vec4 a_color;

    varying vec4 v_color;
    varying vec3 v_normal;

    uniform mat4 u_worldViewProjection;
    uniform mat4 u_world;
    
    
    void main() {
        vec4 position = u_worldViewProjection * a_position;

        gl_Position = position;
        v_color = a_color;
        v_normal = mat3(u_world) * a_normal;
    }
`;

const fsSource = `
    precision mediump float;
    varying vec4 v_color;
    varying vec3 v_normal;
 
    uniform vec3 u_reverseLightDirection;
    uniform vec4 u_lightColor;

    void main() {

        vec3 normal = normalize(v_normal);
        float light = dot(normal, u_reverseLightDirection);

        gl_FragColor = u_lightColor;
        gl_FragColor.rgb *= light;
    }
`;

export default class Scene {
  width: number;
  height: number;
  depth: number;
  x: number;
  y: number;
  z: number;
  gl: ExpoWebGLRenderingContext;
  buffers: {
    pointBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
    colorBuffer: WebGLBuffer;
    normalBuffer: WebGLBuffer;
  } | null;
  vsSource: string = vsSource;
  fsSource: string = fsSource;
  shaders: { fragment: WebGLShader; vertex: WebGLShader } | null;
  program: WebGLProgram | null;
  transform: {
    scale: {
      x: number;
      y: number;
      z: number;
    };
    translate: {
      x: number;
      y: number;
      z: number;
    };
    rotation: {
      x: number;
      y: number;
      z: number;
    };
  };
  locations: {
    attributes: {
      point: number;
      color: number;
      normal: number;
    };
    uniforms: {
      worldViewProjection: WebGLUniformLocation;
      world: WebGLUniformLocation;
      lightColor: WebGLUniformLocation;
      lightReverseDirection: WebGLUniformLocation;
    };
  } | null;
  constructor(gl: ExpoWebGLRenderingContext) {
    this.width = 1;
    this.height = 1;
    this.depth = 1;
    this.x = -0.5;
    this.y = -0.5;
    this.z = 0.5;
    this.gl = gl;
    this.buffers = null;
    this.shaders = null;
    this.program = null;
    this.locations = null;
    this.transform = {
      rotation: {
        x: 0,
        y: 0,
        z: 0,
      },
      scale: {
        x: 1,
        y: 1,
        z: 1,
      },
      translate: {
        x: 0,
        y: 0,
        z: 0,
      },
    };
    this.initBuffers = this.initBuffers.bind(this);
    this.createShaders = this.createShaders.bind(this);
    this.createProgram = this.createProgram.bind(this);
    this.findLocations = this.findLocations.bind(this);
    this.init = this.init.bind(this);
    this.draw = this.draw.bind(this);
    this.draw2 = this.draw2.bind(this);
    this.draw3 = this.draw3.bind(this);
    this.rotateX = this.rotateX.bind(this);
    this.rotateY = this.rotateY.bind(this);
    this.rotateZ = this.rotateZ.bind(this);
    this.translate = this.translate.bind(this);
    this.lookAt = this.lookAt.bind(this);
    this.scale = this.scale.bind(this);
    this.init();
  }

  init() {
    this.createShaders();
    this.createProgram();
    this.initBuffers();
    this.findLocations();
  }

  initBuffers() {
    const points = [
      // Front face
      this.x,
      this.y,
      this.z,
      this.x + this.width,
      this.y,
      this.z,
      this.x + this.width,
      this.y + this.height,
      this.z,
      this.x,
      this.y + this.height,
      this.z,

      // Back face
      this.x,
      this.y,
      this.z - this.depth,
      this.x,
      this.y + this.height,
      this.z - this.depth,
      this.x + this.width,
      this.y + this.height,
      this.z - this.depth,
      this.x + this.width,
      this.y,
      this.z - this.depth,

      // Top face
      this.x,
      this.y + this.height,
      this.z - this.depth,
      this.x,
      this.y + this.height,
      this.z,
      this.x + this.width,
      this.y + this.height,
      this.z,
      this.x + this.width,
      this.y + this.height,
      this.z - this.depth,

      // Bottom face
      this.x,
      this.y,
      this.z - this.depth,
      this.x + this.width,
      this.y,
      this.z - this.depth,
      this.x + this.width,
      this.y,
      this.z,
      this.x,
      this.y,
      this.z,

      // Right face
      this.x + this.width,
      this.y,
      this.z - this.depth,
      this.x + this.width,
      this.y + this.height,
      this.z - this.depth,
      this.x + this.width,
      this.y + this.height,
      this.z,
      this.x + this.width,
      this.y,
      this.z,

      // Left face
      this.x,
      this.y,
      this.z - this.depth,
      this.x,
      this.y,
      this.z,
      this.x,
      this.y + this.height,
      this.z,
      this.x,
      this.y + this.height,
      this.z - this.depth,
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

    const colors = [
      255, 0, 255, 255, 0, 255, 255, 0, 255, 255, 0, 255, 0, 255, 255, 0, 255,
      255, 0, 255, 255, 0, 255, 255, 255, 0, 0, 255, 0, 0, 255, 0, 0, 255, 0, 0,
      0, 0, 255, 0, 0, 255, 0, 0, 255, 0, 0, 255, 0, 128, 123, 0, 128, 123, 0,
      128, 123, 0, 128, 123, 98, 12, 89, 98, 12, 89, 98, 12, 89, 98, 12, 89,
    ];

    const normals = [
      //front
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      //back
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      //top
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      //bottom
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      //right
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      //left
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    ];

    const pointBuffer = this.gl.createBuffer();
    const indexBuffer = this.gl.createBuffer();
    const colorBuffer = this.gl.createBuffer();
    const normalBuffer = this.gl.createBuffer();

    if (!pointBuffer || !indexBuffer || !colorBuffer || !normalBuffer) {
      throw new Error("something went wrong while creating buffer");
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(points),
      this.gl.STATIC_DRAW
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Uint8Array(colors),
      this.gl.STATIC_DRAW
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(normals),
      this.gl.STATIC_DRAW
    );

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      this.gl.STATIC_DRAW
    );

    this.buffers = { indexBuffer, pointBuffer, colorBuffer, normalBuffer };
  }

  createShaders() {
    const vShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    const fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    if (!vShader || !fShader) {
      throw new Error("something went wrong while creating shader");
    }

    this.gl.shaderSource(vShader, this.vsSource);
    this.gl.shaderSource(fShader, this.fsSource);
    this.gl.compileShader(vShader);
    this.gl.compileShader(fShader);
    const isVertexSuccess = this.gl.getShaderParameter(
      vShader,
      this.gl.COMPILE_STATUS
    );
    const isFragmentSuccess = this.gl.getShaderParameter(
      fShader,
      this.gl.COMPILE_STATUS
    );
    if (!isVertexSuccess || !isFragmentSuccess) {
      this.gl.deleteShader(vShader);
      this.gl.deleteShader(fShader);
      throw new Error("shader compilation unsuccesfull");
    }
    this.shaders = { fragment: fShader, vertex: vShader };
  }

  createProgram() {
    if (this.shaders) {
      const program = this.gl.createProgram();
      if (!program) {
        throw new Error("error occured while creating program");
      }
      this.gl.attachShader(program, this.shaders.vertex);
      this.gl.attachShader(program, this.shaders.fragment);
      this.gl.linkProgram(program);
      const isSuccess = this.gl.getProgramParameter(
        program,
        this.gl.LINK_STATUS
      );
      if (!isSuccess) {
        this.gl.deleteProgram(program);
        throw new Error("error occured while linking program");
      }

      this.program = program;
    }
  }
  findLocations() {
    if (this.program) {
      const positionAttributeLocation = this.gl.getAttribLocation(
        this.program,
        "a_position"
      );

      const colorAttributeLocation = this.gl.getAttribLocation(
        this.program,
        "a_color"
      );

      const normalAttributeLocation = this.gl.getAttribLocation(
        this.program,
        "a_normal"
      );

      const worldUniformLocation = this.gl.getUniformLocation(
        this.program,
        "u_world"
      );

      const worldViewProjectionUniformLocation = this.gl.getUniformLocation(
        this.program,
        "u_worldViewProjection"
      );

      const lightColorUniformLocation = this.gl.getUniformLocation(
        this.program,
        "u_lightColor"
      );

      const lightReverseDirectionUniformLocation = this.gl.getUniformLocation(
        this.program,
        "u_reverseLightDirection"
      );

      if (
        !worldUniformLocation ||
        !worldViewProjectionUniformLocation ||
        !lightColorUniformLocation ||
        !lightReverseDirectionUniformLocation ||
        positionAttributeLocation < 0 ||
        normalAttributeLocation < 0 ||
        colorAttributeLocation < 0
      ) {
        throw new Error("somehting went wrong");
      }

      this.locations = {
        attributes: {
          point: positionAttributeLocation,
          color: colorAttributeLocation,
          normal: normalAttributeLocation,
        },
        uniforms: {
          world: worldUniformLocation,
          worldViewProjection: worldViewProjectionUniformLocation,
          lightColor: lightColorUniformLocation,
          lightReverseDirection: lightReverseDirectionUniformLocation,
        },
      };
    }
  }

  rotateX(deg: number) {
    this.transform.rotation.x = (deg * Math.PI) / 180;
  }

  rotateY(deg: number) {
    this.transform.rotation.y = (deg * Math.PI) / 180;
  }

  rotateZ(deg: number) {
    this.transform.rotation.z = (deg * Math.PI) / 180;
  }

  translate(shift: vec3) {
    this.transform.translate = {
      x: shift[0],
      y: shift[1],
      z: shift[2],
    };
  }

  scale(factor: vec3) {
    this.transform.scale = {
      x: factor[0],
      y: factor[1],
      z: factor[2],
    };
  }

  draw() {
    // if (this.locations && this.buffers && this.program) {
    //   this.gl.useProgram(this.program);
    //   const matrix = mat4.create();
    //   mat4.perspective(
    //     matrix,
    //     (80 * Math.PI) / 180,
    //     this.gl.drawingBufferWidth / this.gl.drawingBufferHeight,
    //     1,
    //     1000
    //   );
    //   mat4.translate(matrix, matrix, [
    //     this.transform.translate.x,
    //     this.transform.translate.y,
    //     this.transform.translate.z,
    //   ]);
    //   mat4.rotateX(matrix, matrix, this.transform.rotation.x);
    //   mat4.rotateY(matrix, matrix, this.transform.rotation.y);
    //   mat4.rotateZ(matrix, matrix, this.transform.rotation.z);
    //   mat4.scale(matrix, matrix, [
    //     this.transform.scale.x,
    //     this.transform.scale.y,
    //     this.transform.scale.z,
    //   ]);
    //   this.gl.uniformMatrix4fv(
    //     this.locations.uniforms.projection,
    //     false,
    //     matrix
    //   );
    //   this.gl.enableVertexAttribArray(this.locations.attributes.point);
    //   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.pointBuffer);
    //   this.gl.vertexAttribPointer(
    //     this.locations.attributes.point,
    //     3,
    //     this.gl.FLOAT,
    //     false,
    //     0,
    //     0
    //   );
    //   this.gl.enableVertexAttribArray(this.locations.attributes.color);
    //   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.colorBuffer);
    //   this.gl.vertexAttribPointer(
    //     this.locations.attributes.color,
    //     3,
    //     this.gl.UNSIGNED_BYTE,
    //     true,
    //     0,
    //     0
    //   );
    //   this.gl.bindBuffer(
    //     this.gl.ELEMENT_ARRAY_BUFFER,
    //     this.buffers.indexBuffer
    //   );
    //   const primitiveType = this.gl.TRIANGLES;
    //   const drawOffset = 0;
    //   const count = 36;
    //   const type = this.gl.UNSIGNED_SHORT;
    //   this.gl.drawElements(primitiveType, count, type, drawOffset);
    // }
  }

  draw2(angel: number) {
    const noOfCubes = 6;
    const radius = 10;
    const targetCubePostion = vec3.fromValues(radius, 0, 0);
    const upVector = vec3.fromValues(0, 1, 0);

    // if (this.locations && this.buffers && this.program) {
    //   this.gl.useProgram(this.program);

    //   //create the prospective camera projection
    //   const projectionMatrix = mat4.create();
    //   mat4.perspective(
    //     projectionMatrix,
    //     (80 * Math.PI) / 180,
    //     this.gl.drawingBufferWidth / this.gl.drawingBufferHeight,
    //     1,
    //     1000
    //   );

    //   //creaet the camera transformation matrix;
    //   let cameraMatrix = mat4.create();

    //   mat4.rotateY(cameraMatrix, cameraMatrix, (angel * Math.PI) / 180);
    //   mat4.translate(cameraMatrix, cameraMatrix, [0, 0, radius * 1.5]);

    //   //calculate lookat matrix
    //   const cameraPostion = vec3.fromValues(
    //     cameraMatrix[12],
    //     cameraMatrix[13],
    //     cameraMatrix[14]
    //   );
    //   const zAxis = vec3.create();
    //   const xAxis = vec3.create();
    //   const yAxis = vec3.create();
    //   vec3.normalize(
    //     zAxis,
    //     vec3.subtract(zAxis, cameraPostion, targetCubePostion)
    //   );
    //   vec3.normalize(xAxis, vec3.cross(xAxis, upVector, zAxis));
    //   vec3.normalize(yAxis, vec3.cross(yAxis, zAxis, xAxis));

    //   cameraMatrix = mat4.fromValues(
    //     xAxis[0],
    //     xAxis[1],
    //     xAxis[2],
    //     0,
    //     yAxis[0],
    //     yAxis[1],
    //     yAxis[2],
    //     0,
    //     zAxis[0],
    //     zAxis[1],
    //     zAxis[2],
    //     0,
    //     cameraPostion[0],
    //     cameraPostion[1],
    //     cameraPostion[2],
    //     1
    //   );

    //   //transformation matrix of the world accrding to the camera matrix
    //   const modelViewMatrix = mat4.create();
    //   mat4.invert(modelViewMatrix, cameraMatrix);

    //   const viewProjectionMatrix = mat4.create();
    //   mat4.multiply(viewProjectionMatrix, projectionMatrix, modelViewMatrix);

    //   this.gl.enableVertexAttribArray(this.locations.attributes.point);
    //   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.pointBuffer);
    //   this.gl.vertexAttribPointer(
    //     this.locations.attributes.point,
    //     3,
    //     this.gl.FLOAT,
    //     false,
    //     0,
    //     0
    //   );

    //   this.gl.enableVertexAttribArray(this.locations.attributes.color);
    //   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.colorBuffer);
    //   this.gl.vertexAttribPointer(
    //     this.locations.attributes.color,
    //     3,
    //     this.gl.UNSIGNED_BYTE,
    //     true,
    //     0,
    //     0
    //   );

    //   for (let i = 0; i < noOfCubes; i++) {
    //     const angel = (2 * Math.PI * i) / noOfCubes;
    //     const x = radius * Math.cos(angel);
    //     const z = radius * Math.sin(angel);

    //     //target matrix
    //     const matrix = mat4.create();

    //     mat4.translate(matrix, viewProjectionMatrix, [x, 0, z]);

    //     this.gl.uniformMatrix4fv(
    //       this.locations.uniforms.projection,
    //       false,
    //       matrix
    //     );

    //     this.gl.bindBuffer(
    //       this.gl.ELEMENT_ARRAY_BUFFER,
    //       this.buffers.indexBuffer
    //     );

    //     const primitiveType = this.gl.TRIANGLES;
    //     const drawOffset = 0;
    //     const count = 36;
    //     const type = this.gl.UNSIGNED_SHORT;
    //     this.gl.drawElements(primitiveType, count, type, drawOffset);
    //   }
    // }
  }

  draw3(angel: number) {
    const cameraPosition = vec3.fromValues(-5, 10, 0);
    const targetPosition = vec3.fromValues(5, 5, 5);
    const upDirection = vec3.fromValues(0, 1, 0);
    const lightReverseDirection = vec3.fromValues(0, 0, -5);

    if (this.locations && this.buffers && this.program) {
      this.gl.useProgram(this.program);
      const projectionMatrix = mat4.create();
      mat4.perspective(
        projectionMatrix,
        (60 * Math.PI) / 180,
        this.gl.drawingBufferWidth / this.gl.drawingBufferHeight,
        0,
        1000
      );
      const cameraMatrix = this.lookAt(
        cameraPosition,
        targetPosition,
        upDirection
      );
      const viewMatrix = mat4.create();
      mat4.invert(viewMatrix, cameraMatrix);

      const viewProjectionMatrix = mat4.create();
      mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

      this.gl.enableVertexAttribArray(this.locations.attributes.point);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.pointBuffer);
      this.gl.vertexAttribPointer(
        this.locations.attributes.point,
        3,
        this.gl.FLOAT,
        false,
        0,
        0
      );

      this.gl.enableVertexAttribArray(this.locations.attributes.color);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.colorBuffer);
      this.gl.vertexAttribPointer(
        this.locations.attributes.color,
        3,
        this.gl.UNSIGNED_BYTE,
        true,
        0,
        0
      );

      this.gl.enableVertexAttribArray(this.locations.attributes.normal);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normalBuffer);
      this.gl.vertexAttribPointer(
        this.locations.attributes.normal,
        3,
        this.gl.FLOAT,
        false,
        0,
        0
      );

      const worldMatrix = mat4.create();

      mat4.translate(worldMatrix, worldMatrix, [5, 5, 5]);
      mat4.rotateY(worldMatrix, worldMatrix, (angel * Math.PI) / 180);

      const worldViewProjectionMatrix = mat4.create();
      mat4.multiply(
        worldViewProjectionMatrix,
        viewProjectionMatrix,
        worldMatrix
      );

      this.gl.uniformMatrix4fv(
        this.locations.uniforms.world,
        false,
        worldMatrix
      );

      this.gl.uniformMatrix4fv(
        this.locations.uniforms.worldViewProjection,
        false,
        worldViewProjectionMatrix
      );

      // Set the color to use
      this.gl.uniform4fv(this.locations.uniforms.lightColor, [0.2, 1, 0.2, 1]); // green

      // set the light direction.
      this.gl.uniform3fv(
        this.locations.uniforms.lightReverseDirection,
        vec3.normalize(lightReverseDirection, lightReverseDirection)
      );

      this.gl.bindBuffer(
        this.gl.ELEMENT_ARRAY_BUFFER,
        this.buffers.indexBuffer
      );

      const primitiveType = this.gl.TRIANGLES;
      const drawOffset = 0;
      const count = 36;
      const type = this.gl.UNSIGNED_SHORT;
      this.gl.drawElements(primitiveType, count, type, drawOffset);
    }
  }
  lookAt(cameraPosition: vec3, targetPosition: vec3, up: vec3) {
    const zAxis = vec3.create();
    const xAxis = vec3.create();
    const yAxis = vec3.create();
    vec3.normalize(zAxis, vec3.subtract(zAxis, cameraPosition, targetPosition));
    vec3.normalize(xAxis, vec3.cross(xAxis, up, zAxis));
    vec3.normalize(yAxis, vec3.cross(yAxis, zAxis, xAxis));

    const cameraMatrix = mat4.fromValues(
      xAxis[0],
      xAxis[1],
      xAxis[2],
      0,
      yAxis[0],
      yAxis[1],
      yAxis[2],
      0,
      zAxis[0],
      zAxis[1],
      zAxis[2],
      0,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      1
    );
    return cameraMatrix;
  }
}
