import { useCamera } from "@react-three/drei";
import { Camera, useFrame, useThree } from "@react-three/fiber";
import { useButtonHeld, keycode } from "use-control/lib";
import KEYS from "use-control/lib/keys";
import {
  Euler,
  Intersection,
  Object3D,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import { MutableRefObject, RefObject, useRef } from "react";
import { obstacles } from "./obstacles";

const inputMap = {
  buttons: {
    left: [keycode(KEYS.a)],
    right: [keycode(KEYS.d)],
    forward: [keycode(KEYS.w)],
    back: [keycode(KEYS.s)],
  },
  axes: {},
};

const look = new Vector3();
const UP = new Vector3(0, 1, 0);

const WasdControls = () => {
  const { camera, gl } = useThree();
  const speed = 0.01;

  useButtonHeld(inputMap, "left", 1, () => {
    camera.getWorldDirection(look);
    look.y = 0;
    look.applyAxisAngle(UP, Math.PI / 2);

    camera.position.add(look.multiplyScalar(speed));
  });

  useButtonHeld(inputMap, "right", 1, () => {
    camera.getWorldDirection(look);
    look.y = 0;
    look.applyAxisAngle(UP, -Math.PI / 2);

    camera.position.add(look.multiplyScalar(speed));
  });

  useButtonHeld(inputMap, "forward", 1, () => {
    camera.getWorldDirection(look);
    look.y = 0;

    camera.position.add(look.multiplyScalar(speed));
  });

  useButtonHeld(inputMap, "back", 1, () => {
    camera.getWorldDirection(look);
    look.y = 0;

    camera.position.add(look.multiplyScalar(-speed));
  });

  return null;
};

export default WasdControls;

export type RaycastResult = {
  movement: Vector3;
  hit: Intersection<Object3D>;
};

function tryMove(
  position: Vector3,
  camera: Camera,
  raycaster: Raycaster,
  speed: number,
  angle: number,
  result: MutableRefObject<MovementResult>
) {
  camera.getWorldDirection(look);
  look.y = 0;
  look.normalize();
  look.applyAxisAngle(UP, angle);

  const dir = look.clone();

  const skin = 0.2;
  const movement = dir.clone().multiplyScalar(speed);

  const results = [];
  const e = new Euler(0, 0, 0, "XYZ");
  console.log("performing checks");
  for (let a = -Math.PI / 2; a <= Math.PI / 2; a += Math.PI / 8) {
    const m = movement.clone();
    e.set(0, a, 0);
    m.applyEuler(e);
    m.add(dir.clone().applyAxisAngle(UP, a).multiplyScalar(skin)); // add radius

    raycaster.set(position, m);
    raycaster.far = m.length();

    const intersections = raycaster
      .intersectObjects(obstacles)
      .sort((x) => -x.distance);

    results.push({ movement: m, hit: intersections[0] });
  }

  const hits = results.filter((r) => r.hit !== undefined);
  const isIntersecting = hits.length > 0;

  if (!isIntersecting) {
    position.add(movement);
    result.current.netMovement = movement;
    result.current.hits.length = 0;
  } else {
    hits.sort((r) => r.hit.distance);
    const n = hits[0].hit.face?.normal;

    if (n) {
      const m = hits[0].movement.clone();
      if (hits[0].hit.distance < skin + 0.01) {
        const diff = skin + 0.01 - hits[0].hit.distance;
        const correction = m.multiplyScalar(-diff);
        position.add(correction);
      }

      // TODO(ben): perhaps we're doing this wrong. if a is the angle between m and the normal, I could take the m.length() * sin(a) as the length along the tangent instead

      const t1 = n.clone().applyAxisAngle(UP, Math.PI / 2);
      const t2 = n.clone().applyAxisAngle(UP, -Math.PI / 2);
      const d1 = m.normalize().dot(t1);
      const d2 = m.normalize().dot(t2);
      const t = d1 > d2 ? t2 : t1;
      const d = d1 > d2 ? d2 : d1;

      const v = t.normalize().multiplyScalar(d * speed);
      result.current.netMovement = v;
      position.add(v);
    }
  }
  result.current.hits = results;
}

export type MovementResult = {
  netMovement: Vector3;
  hits: RaycastResult[];
};

export const useWasd = (pos: Vector3) => {
  const { camera, gl, raycaster } = useThree();
  const speed = 0.01;
  const result = useRef({ netMovement: new Vector3(), hits: [] });

  const movement = useRef(new Vector2());

  useFrame(() => {
    const a = movement.current.angle();
    if (movement.current.length() > 0) {
      tryMove(pos, camera, raycaster, speed, a, result);
      movement.current.x = movement.current.y = 0;
    }
  });

  useButtonHeld(inputMap, "left", 1, () => {
    movement.current.y = speed;
  });

  useButtonHeld(inputMap, "right", 1, () => {
    movement.current.y = -speed;
  });

  useButtonHeld(inputMap, "forward", 1, () => {
    movement.current.x = speed;
  });

  useButtonHeld(inputMap, "back", 1, () => {
    movement.current.x = -speed;
  });

  return result;
};
