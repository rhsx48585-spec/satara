import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function Torus({ position, scale }) {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += 0.002;
      ref.current.rotation.y += 0.003;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <torusGeometry args={[2.8, 0.8, 32, 120]} />
      <meshBasicMaterial
        color="#3b82f6"
        wireframe
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

export default function ThreeBackground() {
  return (
    <div className="three-bg">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <ambientLight intensity={1} />

        <Torus position={[6, 3, -2]} scale={1.5} />
        <Torus position={[-6, -3, -3]} scale={1.4} />
        <Torus position={[4, -5, -4]} scale={1.1} />
      </Canvas>
    </div>
  );
}