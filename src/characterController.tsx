import { Html } from "@react-three/drei";
import { Camera, useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useEffect, useRef } from "react";
import { Group, Mesh, Object3D, Vector2, Vector3, Vector3Tuple } from "three";
import { useButtonHeld, useButtonPressed } from "use-control/lib";
import * as aabb from "./aabb";
import { AABB } from "./aabb";
import { inputMap } from "./WasdControls";

export function makePlayerAabb(position: Vector3Tuple) {
  let b = aabb.unit();
  b = aabb.scale(b, new Vector3(0.5, 1.8, 0.5));
  b = aabb.translate(b, new Vector3(0, position[1], 0)); // should be transforming by player Y position
  b = aabb.centerOn(b, new Vector3(...position), new Vector3(1, 0, 1));

  return b;
}

const BABY_EPSILON = 0.0001;
const EPSILON = 0.005;
const UP = new Vector3(0, 1, 0);

export function moveAxis(
  box: AABB,
  movement: number,
  colliders: AABB[],
  axis: Vector3
) {
  const dV = axis.clone().multiplyScalar(movement);
  const sign = Math.sign(movement);
  const index = axis.x !== 0 ? 0 : axis.y !== 0 ? 1 : 2;

  let moved = aabb.translate(box, dV);

  for (const c of colliders) {
    if (!aabb.collides(c, moved)) {
      continue;
    }

    const depth = aabb.depth(moved, c).getComponent(index);
    dV.setComponent(index, dV.getComponent(index) + -sign * (depth + EPSILON));
    moved = aabb.translate(box, dV);

    if (Math.abs(dV.getComponent(index)) <= EPSILON) {
      dV.setComponent(index, 0);
      break;
    }
  }

  const result = dV.getComponent(index);
  return Math.abs(result) <= BABY_EPSILON ? 0 : result;
}

export function move(box: AABB, movement: Vector3, colliders: AABB[]) {
  const result = new Vector3();
  let current = box;

  for (let i = 0; i < 3; i++) {
    const axis = new Vector3();
    axis.setComponent(i, 1);

    const movementAxis = moveAxis(
      box,
      movement.getComponent(i),
      colliders,
      axis
    );
    current = aabb.translate(
      current,
      axis.clone().multiplyScalar(movementAxis)
    );
    result.setComponent(i, movementAxis);
  }

  return result;
}

function useAABB(min: Vector3, max: Vector3) {
  return useRef(aabb.make(min, max));
}

export const obstacles: {
  aabb: MutableRefObject<AABB>;
  obj: MutableRefObject<Object3D | undefined>;
}[] = [];

export const useObstacle = (
  aabbRef: MutableRefObject<AABB>,
  objRef: MutableRefObject<Object3D | undefined>
) => {
  useEffect(() => {
    const o = { aabb: aabbRef, obj: objRef };
    obstacles.push(o);

    return () => {
      const i = obstacles.indexOf(o);
      obstacles.splice(i, 1);
    };
  });
};

const DebugBox = ({ box }: { box: MutableRefObject<AABB> }) => {
  const mesh = useRef<Mesh>();
  useFrame(() => {
    if (mesh.current) {
      mesh.current.position.copy(aabb.center(box.current));
      mesh.current.scale.copy(aabb.size(box.current));
    }
  });

  return (
    <mesh ref={mesh}>
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial wireframe color="green" />
    </mesh>
  );
};

export const Obstacle = ({ position }: { position: Vector3Tuple }) => {
  const collider = useRef(aabb.centerOn(aabb.unit(), new Vector3(...position)));
  const mesh = useRef<Mesh>();

  useObstacle(collider, mesh);

  return (
    <>
      <mesh ref={mesh} position={position}>
        <boxBufferGeometry args={[1, 1, 1]} />
        <meshNormalMaterial />
      </mesh>
      <DebugBox box={collider} />
    </>
  );
};

export const Floor = () => {
  const collider = useRef(
    aabb.make(new Vector3(-10, -0.1, -10), new Vector3(10, 0, 10))
  );
  const mesh = useRef<Mesh>();

  useObstacle(collider, mesh);

  return (
    <>
      <mesh ref={mesh} position={[0, -0.05, 0]}>
        <boxBufferGeometry args={[20, 0.1, 20]} />
        <meshNormalMaterial />
      </mesh>
      <DebugBox box={collider} />
    </>
  );
};

export const useWasd = (speed: number, camera?: Camera) => {
  const movement = useRef(new Vector3());
  const look = useRef(new Vector3());

  useButtonHeld(inputMap, "left", 1, () => {
    if (camera) {
      camera.getWorldDirection(look.current);
      look.current.y = 0;
      look.current.applyAxisAngle(UP, Math.PI / 2);

      movement.current.add(look.current.multiplyScalar(speed));
    } else {
      movement.current.x = -1;
    }
  });

  useButtonHeld(inputMap, "right", 1, () => {
    if (camera) {
      camera.getWorldDirection(look.current);
      look.current.y = 0;
      look.current.applyAxisAngle(UP, -Math.PI / 2);

      movement.current.add(look.current.multiplyScalar(speed));
    } else {
      movement.current.x = 1;
    }
  });

  useButtonHeld(inputMap, "forward", 1, () => {
    if (camera) {
      camera.getWorldDirection(look.current);
      look.current.y = 0;
      look.current.applyAxisAngle(UP, 0);

      movement.current.add(look.current.multiplyScalar(speed));
    } else {
      movement.current.z = -1;
    }
  });

  useButtonHeld(inputMap, "back", 1, () => {
    if (camera) {
      camera.getWorldDirection(look.current);
      look.current.y = 0;
      look.current.applyAxisAngle(UP, Math.PI);

      movement.current.add(look.current.multiplyScalar(speed));
    } else {
      movement.current.z = 1;
    }
  });

  return movement;
};

const useBoxcastPicker = () => {
  const { camera, raycaster } = useThree();
  const collider = useAABB(new Vector3(0, 0, 0), new Vector3(0.01, 0.01, 0.01));
  const pos = useRef(new Vector3());
  const look = useRef(new Vector3());
  const tip = useRef(new Vector3());
  const distance = 4;

  useFrame(() => {
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);

    // camera.getWorldDirection(look.current);
    look.current = raycaster.ray.direction.clone().normalize();
    camera.getWorldPosition(pos.current);
    pos.current.copy(raycaster.ray.origin);

    aabb.copy(aabb.centerOn(collider.current, pos.current), collider.current);

    const end = look.current.clone().multiplyScalar(distance);
    const obs = obstacles.map((o) => o.aabb.current);
    const steps = 32;
    const stepDistance = end.clone().multiplyScalar(1 / steps);
    for (let i = 0; i <= steps; i++) {
      const res = move(collider.current, stepDistance, obs);

      if (res.length() >= stepDistance.length()) {
        const out = aabb.translate(collider.current, res);
        aabb.copy(out, collider.current);
        tip.current.copy(aabb.center(collider.current));
      } else {
        tip.current.copy(aabb.center(collider.current));
        break;
      }
    }
  });

  return [tip, collider] as [MutableRefObject<Vector3>, MutableRefObject<AABB>];
};

// Dumb approach, should cast a small box ourselves
const useRaycastPicker = () => {
  const { scene, raycaster, camera } = useThree();
  const mouse = useRef(new Vector2());
  const tip = useRef(new Vector3());

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handle);

    return () => window.removeEventListener("mousemove", handle);
  });

  useFrame(() => {
    raycaster.setFromCamera(mouse.current, camera);

    const intersections = raycaster.intersectObjects(
      obstacles.map((o) => o.obj.current as Object3D)
    );
    for (const intersection of intersections) {
      tip.current.copy(intersection.point);
    }
  });

  return tip;
};

export const FirstPersonCharacter = ({
  position,
}: {
  position: Vector3Tuple;
}) => {
  const { camera, raycaster } = useThree();
  const collider = useRef(makePlayerAabb(position));
  const movement = useWasd(0.1, camera);
  const speed = 0.05;
  const gravity = 0.05;
  const [raycastTip, raycastCollider] = useBoxcastPicker();

  useFrame(() => {
    // if (movement.current.length() > 0) {
    // obstacles.map perf is bad

    const res = move(
      collider.current,
      new Vector3(
        movement.current.x * speed,
        -0.05,
        movement.current.z * speed
      ),
      obstacles.map((o) => o.aabb.current)
    );

    // console.log(res);

    const out = aabb.translate(collider.current, res);
    aabb.copy(out, collider.current);
    movement.current.x = movement.current.y = movement.current.z = 0;
    // }

    const newPos = aabb.center(collider.current);
    camera.position.copy(newPos);

    if (mesh.current) {
      mesh.current.position.copy(newPos);
    }

    if (picker.current && raycastTip.current) {
      // console.log(raycastTip.current);
      picker.current.position.copy(raycastTip.current);
    }
  });

  useButtonPressed(inputMap, "place", () => {
    sign.current?.position.copy(raycastTip.current);
  });

  const s = aabb.size(collider.current);
  const mesh = useRef<Mesh>();
  const picker = useRef<Mesh>();
  const sign = useRef<Group>();

  return (
    <>
      <mesh ref={mesh}>
        <boxBufferGeometry args={[s.x, s.y, s.z]} />
        <meshNormalMaterial />
      </mesh>
      <mesh ref={picker} scale={0.01}>
        <sphereGeometry />
        <meshStandardMaterial color="red" />
      </mesh>
      <group ref={sign} position={[0, 0, 0]}>
        <Html
          style={{
            fontSize: "64px",
            width: "380px",
            textAlign: "center",
            userSelect: "none",
            transform: "translateX(-50%)",
          }}
        >
          <span style={{ width: "128px" }}>LOOK HERE</span>
        </Html>
      </group>
      <DebugBox box={raycastCollider} />
    </>
  );
};
