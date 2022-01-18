import { Matrix4, Vector3 } from "three";
import { lerp } from "three/src/math/MathUtils";

export type AABB = {
  min: Vector3;
  max: Vector3;
};

const all = (v: number) => new Vector3(v, v, v);
const ZERO = all(0);
const ONE = all(1);

export function make(min?: Vector3, max?: Vector3): AABB {
  return {
    min: min || new Vector3(),
    max: max || new Vector3(),
  };
}

export function unit(): AABB {
  return make(ZERO.clone(), ONE.clone());
}

export function transform(aabb: AABB, mat: Matrix4): AABB {
  return make(
    aabb.min.clone().applyMatrix4(mat),
    aabb.max.clone().applyMatrix4(mat)
  );
}

export function translate(aabb: AABB, translation: Vector3): AABB {
  return make(
    aabb.min.clone().add(translation),
    aabb.max.clone().add(translation)
  );
}

export function scale(aabb: AABB, scale: Vector3): AABB {
  const dist = size(aabb);
  return make(aabb.min.clone(), dist.multiply(scale));
}

export function scaleCenter(aabb: AABB, scale: Vector3): AABB {
  const c = aabb.max.clone().add(aabb.min).divideScalar(2); // center
  const dist = size(aabb);
  const h = dist.clone().divideScalar(2); // hypotenuse?
  const e = h.multiply(scale); // extent?

  return make(c.clone().sub(e), c.clone().add(e));
}

export function scaleCenterScalar(aabb: AABB, scale: number) {
  return scaleCenter(aabb, all(scale));
}

export function centerOn(aabb: AABB, pt: Vector3, axes: Vector3 = ONE.clone()) {
  const dist = size(aabb);
  const h = dist.divideScalar(2);

  return make(
    mix(aabb.min, pt.clone().sub(h), axes),
    mix(aabb.max, pt.clone().add(h), axes)
  );
}

function mix(a: Vector3, b: Vector3, mix: Vector3) {
  return new Vector3(
    lerp(a.x, b.x, mix.x),
    lerp(a.y, b.y, mix.y),
    lerp(a.z, b.z, mix.z)
  );
}

export function center(aabb: AABB) {
  return aabb.min.clone().add(aabb.max).divideScalar(2);
}

export function size(aabb: AABB) {
  return aabb.max.clone().sub(aabb.min);
}

/**
 * Calculates collision depth of one AABB into another
 * @param a
 * @param b
 * @returns separation vector
 */
export function depth(a: AABB, b: AABB) {
  const res = [0, 0, 0];
  const ca = center(a);
  const cb = center(b);

  for (let i = 0; i < 3; i++) {
    res[i] =
      ca.getComponent(i) < cb.getComponent(i)
        ? a.max.getComponent(i) - b.min.getComponent(i)
        : b.max.getComponent(i) - a.min.getComponent(i);
  }

  return new Vector3(...res);
}

/**
 * Do these two AABBs collide?
 * @param a
 * @param b
 * @returns true if colliding
 */
export function collides(a: AABB, b: AABB) {
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y &&
    a.min.z <= b.max.z &&
    a.max.z >= b.min.z
  );
}

/**
 * Does a contain b?
 * @param a
 * @param b
 */
export function contains(a: AABB, pt: Vector3) {
  return (
    pt.x >= a.min.x &&
    pt.x <= a.max.x &&
    pt.y >= a.min.y &&
    pt.y <= a.max.y &&
    pt.z >= a.min.z &&
    pt.z <= a.max.z
  );
}

export function toString(aabb: AABB) {
  return `AABB(${aabb.min}, ${aabb.max})`;
}
