import { useCylinder } from "@react-three/cannon";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { keycode, useButtonHeld } from "use-control/lib";
import KEYS from "use-control/lib/keys";

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
const pos = new Vector3();
const UP = new Vector3(0, 1, 0);

const WasdControls = () => {
  const { camera, gl } = useThree();
  const speed = 0.01;

  const [ref, api] = useCylinder(() => ({
    type: "Kinematic",
    args: [1, 1, 2],
  }));

  useButtonHeld(inputMap, "left", 1, () => {
    camera.getWorldDirection(look);
    look.y = 0;
    look.applyAxisAngle(UP, Math.PI / 2);

    api.position.copy(pos);
    pos.add(look.multiplyScalar(speed));
    api.position.set(pos.x, pos.y, pos.z);
    camera.position.set(pos.x, pos.y, pos.z);
  });

  useButtonHeld(inputMap, "right", 1, () => {
    camera.getWorldDirection(look);
    look.y = 0;
    look.applyAxisAngle(UP, -Math.PI / 2);

    api.position.copy(pos);
    pos.add(look.multiplyScalar(speed));
    api.position.set(pos.x, pos.y, pos.z);
    camera.position.set(pos.x, pos.y, pos.z);
  });

  useButtonHeld(inputMap, "forward", 1, () => {
    camera.getWorldDirection(look);
    look.y = 0;

    api.position.copy(pos);
    pos.add(look.multiplyScalar(speed));
    api.position.set(pos.x, pos.y, pos.z);
    camera.position.set(pos.x, pos.y, pos.z);
  });

  useButtonHeld(inputMap, "back", 1, () => {
    camera.getWorldDirection(look);
    look.y = 0;

    api.position.copy(pos);
    pos.add(look.multiplyScalar(-speed));
    api.position.set(pos.x, pos.y, pos.z);
    camera.position.set(pos.x, pos.y, pos.z);
  });

  return (
    <mesh receiveShadow castShadow ref={ref}>
      <boxGeometry />
      <meshLambertMaterial color="red" />
    </mesh>
  );
};

export default WasdControls;
