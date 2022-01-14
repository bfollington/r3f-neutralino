import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import model from "./suzanne.gltf";

export default function Model(props) {
  const group = useRef();
  const { nodes, materials } = useGLTF(model);
  return (
    <group ref={group} {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Suzanne.geometry}
        material={nodes.Suzanne.material}
        position={[0, 0.19, -0.04]}
      />
    </group>
  );
}

useGLTF.preload(model);
