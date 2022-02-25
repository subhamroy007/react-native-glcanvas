import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { vec3 } from "gl-matrix";
import { Component, ReactNode } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import Camera from "../helpers/core/Camera";
import CubeGemetry from "../helpers/core/CubeGeometry";
import Node from "../helpers/core/Node";
import Scene from "../helpers/core/Scene";
import { WINDOW_HEIGHT, WINDOW_WIDTH } from "../utility/constants";
import { AppCanvasProps, AppCanvasState } from "../utility/types";

export default class AppCanvas extends Component<
  AppCanvasProps,
  AppCanvasState
> {
  state: Readonly<AppCanvasState> = {};
  contextRef: ExpoWebGLRenderingContext | null = null;
  then: number = 0;
  rotation: number = 0;
  constructor(props: AppCanvasProps) {
    super(props);
    this.state = {};
    this.onContextCreate = this.onContextCreate.bind(this);
    this.contextRef = null;
    this.rotation = 0;
    this.then = 0;
  }

  onContextCreate(gl: ExpoWebGLRenderingContext) {
    this.contextRef = gl;

    const scene = new Scene(gl);
    const camera = new Camera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0,
      1000
    );

    const solarSystemNode = new Node(gl);
    const earthsOrbitNode = new Node(gl);
    const moonsOrbitNode = new Node(gl);
    const sun = new CubeGemetry(
      gl,
      undefined,
      1,
      1,
      1,
      vec3.fromValues(255, 255, 0)
    );
    const earth = new CubeGemetry(
      gl,
      undefined,
      1,
      1,
      1,
      vec3.fromValues(0, 128, 192)
    );
    const moon = new CubeGemetry(
      gl,
      undefined,
      1,
      1,
      1,
      vec3.fromValues(128, 128, 128)
    );

    moonsOrbitNode.addNode(moon);

    earthsOrbitNode.addNode(earth);
    earthsOrbitNode.addNode(moonsOrbitNode);

    solarSystemNode.addNode(sun);
    solarSystemNode.addNode(earthsOrbitNode);

    scene.addNode(solarSystemNode);

    const loop = (now: number) => {
      now *= 0.001;
      const deltaTime = now - this.then;

      this.then = now;

      if (!this.contextRef) {
        throw new Error("no context available");
      }

      this.contextRef.viewport(
        0,
        0,
        this.contextRef.drawingBufferWidth,
        this.contextRef.drawingBufferHeight
      );

      this.contextRef.enable(this.contextRef.CULL_FACE);
      this.contextRef.clearColor(0.0, 0.0, 0.0, 1.0);
      this.contextRef.clearDepth(1.0);
      this.contextRef.enable(this.contextRef.DEPTH_TEST);
      this.contextRef.depthFunc(this.contextRef.LEQUAL);

      this.contextRef.clear(
        this.contextRef.COLOR_BUFFER_BIT | this.contextRef.DEPTH_BUFFER_BIT
      );

      scene.clean();
      camera.restore();
      camera.translate(vec3.fromValues(0, 20, 10));
      camera.lookAt(vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
      solarSystemNode.yRotation(this.rotation);
      solarSystemNode.scale(vec3.fromValues(1.7, 1.7, 1.7));
      earthsOrbitNode.translate(vec3.fromValues(5, 0, 0));
      earthsOrbitNode.yRotation(this.rotation);
      earthsOrbitNode.scale(vec3.fromValues(0.7, 0.7, 0.7));
      moonsOrbitNode.translate(vec3.fromValues(2, 0, 0));
      moonsOrbitNode.yRotation(this.rotation);
      moonsOrbitNode.scale(vec3.fromValues(0.5, 0.5, 0.5));

      scene.render(camera);

      this.contextRef.flush();
      this.contextRef.endFrameEXP();

      this.rotation += (deltaTime * 50) % 360;

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  render(): ReactNode {
    return (
      <View style={styles.container}>
        <StatusBar animated={true} hidden={true} />
        <GLView
          style={styles.canvas}
          onContextCreate={this.onContextCreate}
        ></GLView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  canvas: {
    width: "100%",
    height: "100%",
  },
});
