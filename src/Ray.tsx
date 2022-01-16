import { Triplet, useRaycastAll } from "@react-three/cannon";
import { Html, Line } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { BufferGeometry, Line as ThreeLine, Vector3 } from "three";

const vec3ArrayRegex = (indentCount: number) =>
  new RegExp(
    `\\: \\[\\n {${indentCount}}([+-]?\\d+\\.?\\d*),\\n {${indentCount}}([+-]?\\d+\\.?\\d*),\\n {${indentCount}}([+-]?\\d+\\.?\\d*)\\n {${
      indentCount - 2
    }}\\]`,
    "gm"
  );
const vec3ArrayReplacement = (
  _: unknown,
  v1: unknown,
  v2: unknown,
  v3: unknown
) => `: [ ${v1}, ${v2}, ${v3} ]`;

const shapeDataRegex = /^ {2}"shape": \{.*?^ {2}\}/gms;
const shapeDataReplacement = `  "shape": {
    // Shape data here...
  }`;

const bodyDataRegex = /^ {2}"body": \{.*?^ {2}\}/gms;
const bodyDataReplacement = `  "body": {
    // Body data here...
  }`;

export const prettyPrint = (data: unknown) => {
  const indentCount = 2;
  return JSON.stringify(data, null, indentCount)
    .replace(vec3ArrayRegex(indentCount * 2), vec3ArrayReplacement)
    .replace(vec3ArrayRegex(indentCount * 3), vec3ArrayReplacement)
    .replace(shapeDataRegex, shapeDataReplacement)
    .replace(bodyDataRegex, bodyDataReplacement);
};

extend({ ThreeLine });

type RayProps = {
  from: Triplet;
  setHit: (e: {}) => void;
  to: Triplet;
};

export function Ray({ from, to, setHit }: RayProps) {
  useRaycastAll({ from, to }, setHit);
  const geometry = useMemo(() => {
    const points = [from, to].map((v) => new Vector3(...v));
    return new BufferGeometry().setFromPoints(points);
  }, [from, to]);

  return <Line points={[from, to]} color="blue" lineWidth={4} />;
}

function Text({ hit }: { hit: unknown }) {
  return (
    <Html center style={{ pointerEvents: "none" }}>
      <pre>{prettyPrint(hit)}</pre>
    </Html>
  );
}

export default function Raycast() {
  const [hit, setHit] = useState({});

  return (
    <>
      <Ray from={[0, 0, 0]} to={[0, 1.5, 0]} setHit={setHit} />
      <Text hit={hit} />
    </>
  );
}
