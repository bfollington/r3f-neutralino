import { PointerLockControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { FirstPersonCharacter, Floor, Obstacle } from "./characterController";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

ReactDOM.render(
  <React.StrictMode>
    <Canvas>
      <Stats />
      <Suspense fallback={null}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Floor />
        <Obstacle position={[1, 0, 0]} />
        <Obstacle position={[2, 0, 0]} />
        <Obstacle position={[3, 0, 0]} />
        <Obstacle position={[3, 1, 0]} />
        <Obstacle position={[3, 2, 0]} />
        <Obstacle position={[3, 0, 1]} />
        <Obstacle position={[3, 1, 1]} />
        <Obstacle position={[3, 2, 1]} />
        <Obstacle position={[3, 0, 2]} />
        <FirstPersonCharacter position={[1, 1, 0]} />
      </Suspense>
      {/* <WasdControls /> */}
      <PointerLockControls
        addEventListener={undefined}
        hasEventListener={undefined}
        removeEventListener={undefined}
        dispatchEvent={undefined}
      />
      {/* <OrbitControls
        addEventListener={undefined}
        hasEventListener={undefined}
        removeEventListener={undefined}
        dispatchEvent={undefined}
      /> */}
    </Canvas>
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        textAlign: "center",
        verticalAlign: "middle",
        lineHeight: "100vh",
        userSelect: "none",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      +
    </div>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
