import { mat4, vec3 } from "gl-matrix";
import Matrix from "./Matrix";

export default class Camera extends Matrix {
  projectionMatrix: mat4;
  constructor(fov: number, aspect: number, near: number, far: number) {
    super();
    this.projectionMatrix = mat4.create();
    this.getViewProjectionMatrix = this.getViewProjectionMatrix.bind(this);
    this.lookAt = this.lookAt.bind(this);
    mat4.perspective(
      this.projectionMatrix,
      (fov * Math.PI) / 180,
      aspect,
      near,
      far
    );
  }

  lookAt(target: vec3, up: vec3) {
    const cameraPosition = vec3.fromValues(
      this.localMatrix[12],
      this.localMatrix[13],
      this.localMatrix[14]
    );
    const zAxis = vec3.create();
    const xAxis = vec3.create();
    const yAxis = vec3.create();
    vec3.normalize(zAxis, vec3.subtract(zAxis, cameraPosition, target));
    vec3.normalize(xAxis, vec3.cross(xAxis, up, zAxis));
    vec3.normalize(yAxis, vec3.cross(yAxis, zAxis, xAxis));

    this.localMatrix = mat4.fromValues(
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
  }

  getViewProjectionMatrix() {
    const viewMatrix = mat4.create();
    mat4.invert(viewMatrix, this.localMatrix);
    const viewProjectionMatrix = mat4.create();
    mat4.multiply(viewProjectionMatrix, this.projectionMatrix, viewMatrix);

    return viewProjectionMatrix;
  }
}
