import { useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { Mesh, Vector2, Vector3, Vector3Tuple } from "three";
import { useButtonHeld } from "use-control/lib";
import * as aabb from "./aabb";
import { AABB } from "./aabb";
import { inputMap } from "./WasdControls";

export function makePlayerAabb(position: Vector3Tuple) {
  let b = aabb.unit();
  b = aabb.scale(b, new Vector3(0.25, 1.8, 0.25));
  b = aabb.translate(b, new Vector3(0, position[1], 0)); // should be transforming by player Y position
  b = aabb.centerOn(b, new Vector3(...position), new Vector3(1, 0, 1));

  return b;
}

const BABY_EPSILON = 0.0001;
const EPSILON = 0.005;

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

export const obstacles: MutableRefObject<AABB>[] = [];

export const useObstacle = (ref: MutableRefObject<AABB>) => {
  useEffect(() => {
    const o = ref;
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
      <meshStandardMaterial wireframe />
    </mesh>
  );
};

export const Obstacle = ({ position }: { position: Vector3Tuple }) => {
  const collider = useRef(aabb.centerOn(aabb.unit(), new Vector3(...position)));

  useObstacle(collider);

  const mesh = useRef<Mesh>();

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

  useObstacle(collider);

  const mesh = useRef<Mesh>();

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

export const useWasd = () => {
  const movement = useRef(new Vector2());

  useFrame(() => {});

  useButtonHeld(inputMap, "left", 1, () => {
    movement.current.x = -1;
  });

  useButtonHeld(inputMap, "right", 1, () => {
    movement.current.x = 1;
  });

  useButtonHeld(inputMap, "forward", 1, () => {
    movement.current.y = -1;
  });

  useButtonHeld(inputMap, "back", 1, () => {
    movement.current.y = 1;
  });

  return movement;
};

export const Character = ({ position }: { position: Vector3Tuple }) => {
  const collider = useRef(makePlayerAabb(position));
  const movement = useWasd();
  const speed = 0.05;
  const gravity = 0.05;

  useFrame(() => {
    // if (movement.current.length() > 0) {
    // obstacles.map perf is bad
    const res = move(
      collider.current,
      new Vector3(
        movement.current.x * speed,
        -0.05,
        movement.current.y * speed
      ),
      obstacles.map((o) => o.current)
    );

    // console.log(res);

    const out = aabb.translate(collider.current, res);
    collider.current.min = out.min;
    collider.current.max = out.max;
    movement.current.x = movement.current.y = 0;
    // }

    if (mesh.current) {
      mesh.current.position.copy(aabb.center(collider.current));
    }
  });

  const s = aabb.size(collider.current);
  const mesh = useRef<Mesh>();

  return (
    <>
      <mesh ref={mesh}>
        <boxBufferGeometry args={[s.x, s.y, s.z]} />
        <meshNormalMaterial />
      </mesh>
      <DebugBox box={collider} />
    </>
  );
};
