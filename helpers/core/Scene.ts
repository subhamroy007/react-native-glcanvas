import { ExpoWebGLRenderingContext } from "expo-gl";
import Camera from "./Camera";
import Node from "./Node";

export default class Scene {
  nodes: Node[];
  constructor(gl: ExpoWebGLRenderingContext) {
    this.nodes = [];
    this.render = this.render.bind(this);
  }

  addNode(node: Node) {
    this.nodes.push(node);
  }

  clean() {
    this.nodes.forEach((child) => {
      child.restore();
    });
  }

  render(camera: Camera) {
    const viewProjectionMatrix = camera.getViewProjectionMatrix();
    this.nodes.forEach((child) => {
      child.draw(viewProjectionMatrix);
    });
  }
}
