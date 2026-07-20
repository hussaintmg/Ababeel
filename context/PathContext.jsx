// context/PathContext.js
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";

const PathContext = createContext();

export const usePath = () => useContext(PathContext);

const MOBILE_BREAKPOINT = 1024;

function subscribeToResize(callback) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

// Never emits, so the snapshot stays on the server value until hydration.
function subscribeNever() {
  return () => {};
}

export const PathProvider = ({ children }) => {
  const pathname = usePathname();

  // Viewport width and "are we hydrated yet" are external values, so they are
  // read through useSyncExternalStore instead of being mirrored into state by
  // an effect. The server snapshots match the previous initial state, so the
  // first client render still agrees with the server markup.
  const isMobile = useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false
  );

  const hasMounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );

  // Everything below is a pure function of the pathname, so it is computed
  // during render rather than stored in state and resynced from an effect.
  const isOwner = pathname?.includes("/owner") || false;
  const isAdmin = (pathname?.includes("/admin") && !isOwner) || false;
  const isDashboard =
    (pathname?.includes("/dashboard") && !isOwner && !isAdmin) || false;
  const isLogSign = pathname?.includes("/login") || false;
  const showFooter = !(
    isLogSign ||
    pathname?.includes("/admin") ||
    pathname?.includes("/dashboard") ||
    pathname?.includes("/owner")
  );

  const [dashboardSideBarOpen, setDashboardSideBarOpen] = useState(false);
  const [adminSideBarOpen, setAdminSideBarOpen] = useState(false);
  const [ownerSideBarOpen, setOwnerSideBarOpen] = useState(false);

  // Sidebars are real state (the user can toggle them), but they snap back to
  // a route- and viewport-appropriate default whenever either changes. That
  // reset is done by comparing against the previous key during render — the
  // pattern React recommends for adjusting state on prop changes — so no
  // effect writes state here.
  const sidebarKey = `${pathname}|${isMobile}|${hasMounted}`;
  const [lastSidebarKey, setLastSidebarKey] = useState(null);

  if (sidebarKey !== lastSidebarKey) {
    setLastSidebarKey(sidebarKey);
    // On mobile every sidebar is closed; on desktop the one matching the
    // current section is opened, owner taking priority over admin.
    const canOpen = hasMounted && !isMobile;
    setOwnerSideBarOpen(canOpen && isOwner);
    setAdminSideBarOpen(canOpen && isAdmin);
    setDashboardSideBarOpen(canOpen && isDashboard);
  }

  const toggleDashboardSidebar = useCallback(
    () => setDashboardSideBarOpen((prev) => !prev),
    []
  );
  const toggleAdminSidebar = useCallback(
    () => setAdminSideBarOpen((prev) => !prev),
    []
  );
  const toggleOwnerSidebar = useCallback(
    () => setOwnerSideBarOpen((prev) => !prev),
    []
  );

  return (
    <PathContext.Provider
      value={{
        currentPath: pathname,
        // Consumers such as TopbarSidebarComponentWrapper already destructure
        // these two; they were previously absent from the value and silently
        // resolved to undefined.
        pathname,
        hasMounted,
        showFooter,
        isDashboard,
        dashboardSideBarOpen,
        setDashboardSideBarOpen,
        toggleDashboardSidebar,
        isAdmin,
        adminSideBarOpen,
        setAdminSideBarOpen,
        toggleAdminSidebar,
        isOwner,
        ownerSideBarOpen,
        setOwnerSideBarOpen,
        toggleOwnerSidebar,
        isMobile,
        isLogSign,
      }}
    >
      {children}
    </PathContext.Provider>
  );
};
