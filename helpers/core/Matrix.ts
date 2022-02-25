import { mat4, vec3 } from "gl-matrix";

export default class Matrix {
  localMatrix: mat4;

  constructor() {
    this.localMatrix = mat4.create();
    this.translate = this.translate.bind(this);
    this.scale = this.scale.bind(this);
    this.xRotation = this.xRotation.bind(this);
    this.yRotation = this.yRotation.bind(this);
    this.zRotation = this.zRotation.bind(this);
    this.restore = this.restore.bind(this);
  }

  restore() {
    mat4.identity(this.localMatrix);
  }

  translate(translation: vec3) {
    mat4.translate(this.localMatrix, this.localMatrix, translation);
  }

  scale(scale: vec3) {
    mat4.scale(this.localMatrix, this.localMatrix, scale);
  }

  xRotation(angel: number) {
    angel = (angel * Math.PI) / 180;
    mat4.rotateX(this.localMatrix, this.localMatrix, angel);
  }

  yRotation(angel: number) {
    angel = (angel * Math.PI) / 180;
    mat4.rotateY(this.localMatrix, this.localMatrix, angel);
  }

  zRotation(angel: number) {
    angel = (angel * Math.PI) / 180;
    mat4.rotateZ(this.localMatrix, this.localMatrix, angel);
  }
}
