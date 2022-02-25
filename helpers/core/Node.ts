import { ExpoWebGLRenderingContext } from "expo-gl";
import { mat4, vec3 } from "gl-matrix";
import Matrix from "./Matrix";

export default class Node extends Matrix {
  position: vec3;
  children: Node[];
  gl: ExpoWebGLRenderingContext;
  constructor(gl: ExpoWebGLRenderingContext, position?: vec3) {
    super();
    this.position = position ? position : vec3.fromValues(0, 0, 0);
    this.gl = gl;
    this.children = [];
    this.addNode = this.addNode.bind(this);
    this.initProgram = this.initProgram.bind(this);
    this.initBuffer = this.initBuffer.bind(this);
    this.initTexture = this.initTexture.bind(this);
    this.lookupLocation = this.lookupLocation.bind(this);
    this.init = this.init.bind(this);
    this.draw = this.draw.bind(this);
  }

  restore() {
    super.restore();
    this.children.forEach((child) => {
      child.restore();
    });
  }

  addNode(child: Node) {
    this.children.push(child);
  }

  initProgram() {}

  initBuffer() {}

  lookupLocation() {}

  initTexture() {}

  init() {}

  draw(parentMatrix: mat4) {
    const worldMatrix = mat4.create();
    mat4.multiply(worldMatrix, parentMatrix, this.localMatrix);
    this.children.forEach((child) => {
      child.draw(worldMatrix);
    });
  }
}
