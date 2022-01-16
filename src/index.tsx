import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import ReactDOM from "react-dom";
import React, {
  MutableRefObject,
  RefObject,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Suzanne from "./Suzanne";
import {
  Cylinder,
  Line,
  OrbitControls,
  PerspectiveCamera,
  PointerLockControls,
  Stats,
} from "@react-three/drei";
import WasdControls, { useWasd } from "./WasdControls";
import { Ray } from "./Ray";
import { Physics, Triplet, useBox, useRaycastAll } from "@react-three/cannon";
import { Euler, Group, Object3D, Quaternion, Vector3 } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";

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

const obstacles: Object3D[] = [];
(window as any).obstacles = obstacles;

const useObstacle = (ref: RefObject<Object3D>) => {
  useEffect(() => {
    const o = ref.current;
    if (o) {
      obstacles.push(o);

      return () => {
        const i = obstacles.indexOf(o);
        obstacles.splice(i, 1);
      };
    }
  });
};

const Obstacle = ({ position }: { position: Triplet }) => {
  const [ref] = useBox(() => ({ position }));
  useObstacle(ref);

  return (
    <mesh ref={ref}>
      <boxGeometry />
    </mesh>
  );
};

const vecToTriplet = (v: Vector3): Triplet => [v.x, v.y, v.z];
const tripletToVec = (t: Triplet) => new Vector3(...t);

const look: Vector3 = new Vector3();

const useLocalRay = (
  ref: RefObject<Line2>,
  direction: Triplet,
  onUpdate: (v: boolean) => void
) => {
  const { camera, raycaster, scene } = useThree();
  const [intersecting, setIntersecting] = useState(false);
  const from = useRef<Triplet>([0, 0, 0]);
  const to = useRef<Triplet>([0, 0, 0]);

  useFrame(() => {
    camera.getWorldDirection(look);
    look.y = 0;
    look.normalize();
    const o = new Vector3(0, 0, 0);
    const e = new Euler(...direction, "XYZ");
    const target = o.clone().add(look.applyEuler(e).multiplyScalar(1));
    from.current = vecToTriplet(o);
    to.current = vecToTriplet(target);

    const l = ref.current;
    if (l) {
      l.geometry.setPositions([from.current, to.current].flat());

      raycaster.set(l.localToWorld(o), look);
      raycaster.far = target.length();
      const intersections = raycaster.intersectObjects(obstacles);
      const isIntersecting = intersections.length > 0;

      if (intersecting !== isIntersecting) {
        onUpdate(isIntersecting);
        setIntersecting(isIntersecting);
      }
    }
  });

  return [intersecting, from.current, to.current] as [
    boolean,
    Triplet,
    Triplet
  ];
};

const LocalRay = ({
  direction,
  onUpdate,
}: {
  direction: Triplet;
  onUpdate: (v: boolean) => void;
}) => {
  const ref = useRef<any>();
  const [intersecting, from, to] = useLocalRay(ref, direction, onUpdate);

  return (
    <Line
      ref={ref}
      points={[from, to]}
      color={intersecting ? "red" : "blue"}
      lineWidth={4}
    />
  );
};

const playerPosition = new Vector3();

const Player = ({ position }: { position: Triplet }) => {
  const { camera, raycaster, scene } = useThree();
  const hits = useRef([false, false, false, false, false, false]);
  useWasd(playerPosition, hits);

  const ref = useRef<Group>();

  useFrame(() => {
    ref.current?.position.copy(playerPosition);
  });

  return (
    <group ref={ref} position={position}>
      <Cylinder args={[0.2, 0.2, 1]}>
        <meshStandardMaterial color="red" />
      </Cylinder>
      <LocalRay direction={[0, 0, 0]} onUpdate={(v) => (hits.current[0] = v)} />
      <LocalRay
        direction={[0, Math.PI / 4, 0]}
        onUpdate={(v) => (hits.current[1] = v)}
      />
      <LocalRay
        direction={[0, Math.PI / 2, 0]}
        onUpdate={(v) => (hits.current[2] = v)}
      />
      <LocalRay
        direction={[0, -Math.PI / 4, 0]}
        onUpdate={(v) => (hits.current[3] = v)}
      />
      <LocalRay
        direction={[0, Math.PI, 0]}
        onUpdate={(v) => (hits.current[4] = v)}
      />
      <LocalRay
        direction={[0, (3 / 2) * Math.PI, 0]}
        onUpdate={(v) => (hits.current[5] = v)}
      />
    </group>
  );
};

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
          <Obstacle position={[0, 0, 1]} />
          <Obstacle position={[1, 0, 1]} />
          <Obstacle position={[3, 0, 3]} />
          <Obstacle position={[-3, 0, 3]} />
          <Player position={[1, 0, 1]} />
        </Physics>
      </Suspense>
      {/* <WasdControls /> */}
      {/* <PointerLockControls
        addEventListener={undefined}
        hasEventListener={undefined}
        removeEventListener={undefined}
        dispatchEvent={undefined}
      /> */}
      <OrbitControls
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
