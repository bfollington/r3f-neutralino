import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import ReactDOM from "react-dom";
import React, { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import Suzanne from "./Suzanne";
import {
  OrbitControls,
  PerspectiveCamera,
  PointerLockControls,
  Stats,
} from "@react-three/drei";
import WasdControls from "./WasdControls";
import { Physics, useBox, usePlane } from "@react-three/cannon";

function Box(props: any) {
  // This reference gives us direct access to the THREE.Mesh object
  // const ref = useRef() as any;
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  // useFrame((state, delta) => (ref.current.rotation.x += 0.01));
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <Suzanne
      {...props}
      scale={clicked ? 1.5 : 1}
      onClick={() => click(!clicked)}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
    />
  );
}

function Cube(props: any) {
  const [ref] = useBox(() => ({
    mass: 1,
    position: [0, 5, 0],
    rotation: [0.4, 0.2, 0.5],
    ...props,
  }));
  return (
    <mesh receiveShadow castShadow ref={ref}>
      <boxGeometry />
      <meshLambertMaterial color="hotpink" />
    </mesh>
  );
}

function Floor(props: any) {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[1000, 1000]} />
      <shadowMaterial color="#171717" transparent opacity={0.4} />
    </mesh>
  );
}

function Wall(props: any) {
  const [ref] = usePlane(() => ({
    type: "Static",
    rotation: [0, 0, 0],
    ...props,
  }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="blue" />
      {/* <shadowMaterial color="#171717" transparent opacity={0.4} /> */}
    </mesh>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Canvas>
      <Stats />
      <Suspense fallback={null}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        {/* <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} /> */}
        <Physics>
          <Floor />
          <Wall position={[0, 0, -10]} />
          <Cube position={[0, 8, 0]} />
          <Cube />
          <WasdControls />
        </Physics>
      </Suspense>
      <PointerLockControls
        addEventListener={undefined}
        hasEventListener={undefined}
        removeEventListener={undefined}
        dispatchEvent={undefined}
      />
    </Canvas>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
