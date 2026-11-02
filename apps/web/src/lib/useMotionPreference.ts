import { useSyncExternalStore } from "react";
const query = "(prefers-reduced-motion: reduce)";
const subscribe = (changed: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
const snapshot = () => window.matchMedia(query).matches;
/** React to preference changes while the page is open, including pin cleanup. */
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
