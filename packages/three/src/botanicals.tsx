import { useMemo, useEffect } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  SphereGeometry,
  DataTexture,
  RGBAFormat,
  RepeatWrapping,
  DoubleSide,
} from "three";
export function useBotanicalAssets() {
  const assets = useMemo(() => {
    const berry = new SphereGeometry(0.14, 28, 20);
    const p = berry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      const k = 1 + 0.018 * Math.sin(x * 65 + y * 47) * Math.cos(z * 63);
      p.setXYZ(i, x * k * 0.85, y * k, z * k * 0.88);
    }
    berry.computeVertexNormals();
    const leaf = new BufferGeometry();
    const positions: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12,
        width = Math.sin(Math.PI * t) * 0.09;
      for (let j = 0; j < 3; j++) {
        positions.push(
          (j - 1) * width,
          t * 0.42,
          0.035 * Math.sin(t * Math.PI) + (j === 1 ? 0.012 : 0),
        );
        uv.push(j / 2, t);
      }
    }
    for (let i = 0; i < 12; i++)
      for (let j = 0; j < 2; j++) {
        const a = i * 3 + j;
        indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
      }
    leaf.setAttribute("position", new Float32BufferAttribute(positions, 3));
    leaf.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    leaf.setIndex(indices);
    leaf.computeVertexNormals();
    const data = new Uint8Array(64 * 64 * 4);
    for (let i = 0; i < 64 * 64; i++) {
      const v =
        130 +
        Math.floor(((((Math.sin(i * 127.1) * 43758.5453) % 1) + 1) % 1) * 60);
      data.set([v, v, v, 255], i * 4);
    }
    const grain = new DataTexture(data, 64, 64, RGBAFormat);
    grain.wrapS = grain.wrapT = RepeatWrapping;
    grain.needsUpdate = true;
    return { berry, leaf, grain };
  }, []);
  useEffect(
    () => () => {
      assets.berry.dispose();
      assets.leaf.dispose();
      assets.grain.dispose();
    },
    [assets],
  );
  return assets;
}
export type BotanicalAssets = ReturnType<typeof useBotanicalAssets>;
export function Berry({
  assets,
  position = [0, 0, 0],
  scale = 1,
  index = 0,
}: {
  assets: BotanicalAssets;
  position?: [number, number, number];
  scale?: number;
  index?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh geometry={assets.berry}>
        <meshPhysicalMaterial
          color={["#5d203f", "#3a1838", "#842344"][index % 3]}
          roughness={0.48}
          roughnessMap={assets.grain}
          bumpMap={assets.grain}
          bumpScale={0.0022}
          clearcoat={0.16}
          clearcoatRoughness={0.42}
          sheen={0.22}
          sheenColor="#b57483"
        />
      </mesh>
      <mesh position={[0, 0.145, 0]} rotation-z={0.3}>
        <cylinderGeometry args={[0.009, 0.006, 0.095, 7]} />
        <meshStandardMaterial color="#7e7048" roughness={0.9} />
      </mesh>
      <mesh
        geometry={assets.leaf}
        position={[0.012, 0.14, 0]}
        rotation={[0.25, 0.3, -1.05]}
        scale={0.6}
      >
        <meshStandardMaterial
          color="#718666"
          roughness={0.68}
          side={DoubleSide}
          bumpMap={assets.grain}
          bumpScale={0.001}
        />
      </mesh>
    </group>
  );
}
export function NativePlant({ assets }: { assets: BotanicalAssets }) {
  return (
    <group>
      <mesh position={[0, 0.29, 0]}>
        <cylinderGeometry args={[0.01, 0.019, 0.58, 6]} />
        <meshStandardMaterial color="#927e63" roughness={1} />
      </mesh>
      {[-1, 1].map((dir) => (
        <group key={dir}>
          <mesh position={[dir * 0.12, 0.39, 0]} rotation-z={dir * -0.6}>
            <cylinderGeometry args={[0.005, 0.011, 0.37, 5]} />
            <meshStandardMaterial color="#9c8a6b" roughness={1} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              geometry={assets.leaf}
              position={[dir * (0.045 + i * 0.065), 0.29 + i * 0.13, 0]}
              rotation={[0.2, dir * 0.6, dir * -0.7]}
              scale={[0.5, 0.55, 0.7]}
            >
              <meshStandardMaterial
                color={dir === 1 ? "#8c9d76" : "#617a61"}
                roughness={0.85}
                side={DoubleSide}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
