import { Camera, CameraMountError, PermissionStatus } from "expo-camera";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { StatusBar } from "expo-status-bar";
import { Component, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WINDOW_HEIGHT, WINDOW_WIDTH } from "../utility/constants";

export interface AppCameraProps {}

export interface AppCameraState {
  pictureSize?: string;
  ratio?: string;
  isAvailable: boolean;
  type?: number | "front" | "back";
  hasPermission: boolean;
  isError: boolean;
  flashMode: "auto" | "on" | "off" | "torch";
  autoFocus: number | boolean | "auto" | "on" | "off" | "singleShot";
  zoom: number;
  whiteBalance:
    | number
    | "auto"
    | "sunny"
    | "cloudy"
    | "shadow"
    | "incandescent"
    | "fluorescent"
    | "continuous"
    | "manual";
}

export default class AppCamera extends Component<
  AppCameraProps,
  AppCameraState
> {
  state: Readonly<AppCameraState> = {
    autoFocus: "auto",
    flashMode: "auto",
    hasPermission: false,
    isAvailable: false,
    isError: false,
    whiteBalance: "auto",
    zoom: 0,
  };
  cameraRef: Camera | null = null;
  glViewRef: GLView | null = null;
  constructor(props: AppCameraProps) {
    super(props);
    this.state = {
      autoFocus: "auto",
      flashMode: "auto",
      hasPermission: false,
      isAvailable: false,
      isError: false,
      whiteBalance: "auto",
      zoom: 0,
    };
    this.initCamera = this.initCamera.bind(this);
    this.onCameraReady = this.onCameraReady.bind(this);
    this.onCameraMountError = this.onCameraMountError.bind(this);
    this.onContextCreate = this.onContextCreate.bind(this);
    this.cameraRef = null;
    this.glViewRef = null;
  }

  async initCamera() {
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    if (cameraPermission.status !== PermissionStatus.GRANTED) {
      console.log("camera permission is not granted");
      return;
    }

    this.setState((state) => ({
      ...state,
      isAvailable: true,
      hasPermission: true,
      type: "back",
    }));
  }

  async onCameraReady() {
    let ratio = WINDOW_WIDTH + ":" + WINDOW_HEIGHT;
    let pictureSize = WINDOW_WIDTH + ":" + WINDOW_HEIGHT;

    if (this.cameraRef) {
      const ratioList = await this.cameraRef.getSupportedRatiosAsync();

      if (ratioList.length > 0 && ratioList[0].trim() !== "") {
        ratio = ratioList[1];
      }
      const pictureSizeList =
        await this.cameraRef.getAvailablePictureSizesAsync(ratio);
      if (pictureSizeList.length > 0 && pictureSizeList[0].trim() !== "") {
        pictureSize = pictureSizeList[0];
      }
    }

    this.setState((state) => ({
      ...state,
      pictureSize,
      ratio,
    }));

    console.log("camera is ready for use");
    console.log("camera ratio = " + ratio);
    console.log("camera picture size = " + pictureSize);
  }

  onCameraMountError({ message }: CameraMountError) {
    console.log("could not mount camera " + message);
    this.setState((state) => ({
      ...state,
      isError: true,
    }));
  }

  componentDidMount() {
    this.initCamera();
  }

  onContextCreate(gl: ExpoWebGLRenderingContext) {
    if (this.glViewRef) {
      this.glViewRef.createCameraTextureAsync(this.cameraRef);
    }
  }

  render(): ReactNode {
    const { hasPermission, isAvailable, isError, ...cameraProps } = this.state;

    return (
      <View style={styles.container}>
        <StatusBar animated={true} hidden={true} />
        {isAvailable ? (
          isError ? (
            <Text style={styles.text}>{"somehting went wrong"}</Text>
          ) : hasPermission ? (
            <Camera
              {...cameraProps}
              //   style={styles.camera}
              ref={(ref) => {
                this.cameraRef = ref;
              }}
              onCameraReady={this.onCameraReady}
              onMountError={this.onCameraMountError}
            />
          ) : (
            <Text style={styles.text}>{"camera permission required"}</Text>
          )
        ) : (
          <Text style={styles.text}>{"camera not available"}</Text>
        )}
        <GLView
          onContextCreate={this.onContextCreate}
          ref={(ref) => {
            this.glViewRef = ref;
          }}
          style={styles.canvas}
        ></GLView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    backgroundColor: "black",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  },
  text: {
    color: "white",
    fontSize: 16,
  },
  canvas: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  },
});
