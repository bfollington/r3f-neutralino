import { useCamera } from "@react-three/drei";
import { Camera, useThree } from "@react-three/fiber";
import { useButtonHeld, keycode } from "use-control/lib";
import KEYS from "use-control/lib/keys";
import { Vector3 } from "three";

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
