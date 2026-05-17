import { useSyncExternalStore } from "react";
import {
  pagesStore,
  menuStore,
  headerStore,
  footerStore,
} from "@/lib/admin/cms-store";

export function usePages() {
  return useSyncExternalStore(
    pagesStore.subscribe,
    pagesStore.get,
    pagesStore.get,
  );
}
export function useMenu() {
  return useSyncExternalStore(menuStore.subscribe, menuStore.get, menuStore.get);
}
export function useHeader() {
  return useSyncExternalStore(headerStore.subscribe, headerStore.get, headerStore.get);
}
export function useFooter() {
  return useSyncExternalStore(footerStore.subscribe, footerStore.get, footerStore.get);
}
