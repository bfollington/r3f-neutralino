import { Vector3 } from "three";
import * as aabb from "./aabb";

export function makePlayerAabb() {
  const pos = new Vector3(0, 0, 0);
  let b = aabb.unit();
  b = aabb.scale(b, new Vector3(0.25, 1.8, 0.25));
  b = aabb.translate(b, new Vector3(0, pos.y, 0)); // should be transforming by player Y position
  b = aabb.centerOn(b, pos, new Vector3(1, 0, 1));

  return b;
}
