import { Triplet, useBox } from "@react-three/cannon";
import { Cylinder, Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, {
  MutableRefObject,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { Euler, Group, Vector3 } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import "./index.css";
import { obstacles, useObstacle } from "./obstacles";
import Suzanne from "./Suzanne";
import { MovementResult, RaycastResult, useWasd } from "./WasdControls";

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

const useDebugRay = (
  ref: RefObject<Line2>,
  v: MutableRefObject<{ netMovement: Vector3; hits: RaycastResult[] }>
) => {
  useFrame(() => {
    const o = new Vector3(0, 0, 0);
    const target = v.current.netMovement.clone().multiplyScalar(200);

    const l = ref.current;
    if (l && target.length() > 0) {
      // debugger;
      l.geometry.setPositions([vecToTriplet(o), vecToTriplet(target)].flat());
    }
  });

  return;
};

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

const PlayerDebug = ({
  result,
}: {
  result: MutableRefObject<MovementResult>;
}) => {
  const rays = [...Array(8)].map((_, i) => i);
  const refs = useRef<any[]>(rays.map((_) => null));

  useFrame(() => {
    const o = new Vector3(0, 0, 0);

    for (let i = 0; i < result.current.hits.length; i++) {
      const v = result.current.hits[i];
      const target = v.movement.clone().multiplyScalar(2);

      const l = refs.current[i];
      if (l && target.length() > 0) {
        // debugger;
        l.geometry.setPositions([vecToTriplet(o), vecToTriplet(target)].flat());
      }
    }
  });

  return (
    <>
      {rays.map((r) => (
        <Line
          key={r}
          ref={(el) => (refs.current[r] = el)}
          points={[
            [0, 0, 0],
            [0, 0, 0],
          ]}
          color="purple"
          lineWidth={2}
        />
      ))}
    </>
  );
};

const Player = ({ position }: { position: Triplet }) => {
  const { camera, raycaster, scene } = useThree();
  const result = useWasd(playerPosition);

  const ref = useRef<Group>();
  const moveRayDebug = useRef() as any;
  useDebugRay(moveRayDebug, result);

  useEffect(() => {
    playerPosition.set(...position);
  }, [position]);

  useFrame(() => {
    ref.current?.position.copy(playerPosition);
  });

  return (
    <group ref={ref} position={position}>
      <Cylinder args={[0.2, 0.2, 1]}>
        <meshStandardMaterial color="red" />
      </Cylinder>
      <PlayerDebug result={result} />
      <Line
        ref={moveRayDebug}
        points={[
          [0, 0, 0],
          [1, 0, 0],
        ]}
        color="green"
        lineWidth={4}
      />
    </group>
  );
};
