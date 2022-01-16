import { useCamera } from "@react-three/drei";
import { Camera, useThree } from "@react-three/fiber";
import { useButtonHeld, keycode } from "use-control/lib";
import KEYS from "use-control/lib/keys";
import { Raycaster, Vector3 } from "three";
import { MutableRefObject, RefObject } from "react";
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

function tryMove(
  position: Vector3,
  camera: Camera,
  raycaster: Raycaster,
  speed: number,
  angle: number
) {
  camera.getWorldDirection(look);
  look.y = 0;
  look.normalize();
  look.applyAxisAngle(UP, angle);

  const movement = look.multiplyScalar(speed);
  raycaster.set(position, movement);
  raycaster.far = 1;

  const intersections = raycaster.intersectObjects(obstacles);
  const isIntersecting = intersections.length > 0;

  if (!isIntersecting) {
    position.add(look.multiplyScalar(speed));
  } else {
    const n = intersections[0].face?.normal;
    if (n) {
      const t = n.clone().applyAxisAngle(UP, Math.PI / 2);
      const d = movement.normalize().dot(t);
      position.add(t.normalize().multiplyScalar(d * speed * 0.1));
    }
  }
}

export const useWasd = (pos: Vector3, hits: MutableRefObject<boolean[]>) => {
  const { camera, gl, raycaster } = useThree();
  const speed = 0.1;

  useButtonHeld(inputMap, "left", 1, () => {
    tryMove(pos, camera, raycaster, speed, Math.PI / 2);
  });

  useButtonHeld(inputMap, "right", 1, () => {
    tryMove(pos, camera, raycaster, speed, -Math.PI / 2);
  });

  useButtonHeld(inputMap, "forward", 1, () => {
    tryMove(pos, camera, raycaster, speed, 0);
  });

  useButtonHeld(inputMap, "back", 1, () => {
    tryMove(pos, camera, raycaster, speed, Math.PI);
  });

  return null;
};
