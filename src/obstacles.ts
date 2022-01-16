import { RefObject, useEffect } from "react";
import { Object3D } from "three";

export const obstacles: Object3D[] = [];
(window as any).obstacles = obstacles;

export const useObstacle = (ref: RefObject<Object3D>) => {
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
