/** Supplied packaging, with embedded original artwork. No synthetic variants. */
export const modelRegistry = {
  sergeenee: {
    url: "/models/sergeenee.glb",
    original: "sergeenee_product_FINAL.glb",
    image: "/images/sergeenee.png",
    front: -0.24,
    theme: "#efaa50",
  },
  wolfberry: {
    url: "/models/wolfberry.glb",
    original: "qn_black_wolfberry.glb",
    image: "/images/wolfberry.png",
    front: -0.24,
    theme: "#b99bd2",
  },
} as const;
export type ModelId = keyof typeof modelRegistry;
