"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { commandRegistry, CommandCategory, CommandScope } from "@/lib/commands/registry";
import {
  isBrowserReserved,
  isEditableTarget,
  matchShortcut,
  formatShortcut,
  isMac,
} from "@/lib/commands/keyboard";
import { overlayStack } from "@/lib/commands/overlayStack";
import { useAuth } from "@/context/AuthContext";

const CommandContext = createContext(null);

export function CommandProvider({ children }) {
  let router = null;
  try {
    router = useRouter();
  } catch {}

  let pathname = "";
  try {
    pathname = usePathname() || "";
  } catch {}

  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user || null;
  } catch {}

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [paletteInitialQuery, setPaletteInitialQuery] = useState("");
  const [activeScopes, setActiveScopes] = useState([CommandScope.GLOBAL, CommandScope.PAGE]);
  const [registryVersion, setRegistryVersion] = useState(0);

  // Store last active element to restore focus after palette or help dismissal
  const lastActiveElementRef = useRef(null);

  // Re-render when commands in registry change
  useEffect(() => {
    return commandRegistry.subscribe(() => {
      setRegistryVersion((v) => v + 1);
    });
  }, []);

  // Clear overlays and reset scopes on route change
  useEffect(() => {
    overlayStack.clear();
    setPaletteOpen(false);
    setShortcutsModalOpen(false);
    setActiveScopes([CommandScope.GLOBAL, CommandScope.PAGE]);
  }, [pathname]);

  const openPalette = useCallback((query = "") => {
    lastActiveElementRef.current = document.activeElement;
    setPaletteInitialQuery(query);
    setPaletteOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
    if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === "function") {
      try {
        lastActiveElementRef.current.focus();
      } catch {}
    }
  }, []);

  const openShortcutsModal = useCallback(() => {
    lastActiveElementRef.current = document.activeElement;
    setShortcutsModalOpen(true);
  }, []);

  const closeShortcutsModal = useCallback(() => {
    setShortcutsModalOpen(false);
    if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === "function") {
      try {
        lastActiveElementRef.current.focus();
      } catch {}
    }
  }, []);

  const pushScope = useCallback((scope) => {
    if (!scope) return;
    setActiveScopes((prev) => (prev.includes(scope) ? prev : [...prev, scope]));
  }, []);

  const popScope = useCallback((scope) => {
    if (!scope) return;
    setActiveScopes((prev) => prev.filter((s) => s !== scope));
  }, []);

  const pushOverlay = useCallback((id, dismissFn) => {
    overlayStack.push(id, dismissFn);
  }, []);

  const popOverlay = useCallback((id) => {
    overlayStack.pop(id);
  }, []);

  const registerCommand = useCallback((definition) => {
    return commandRegistry.register(definition);
  }, []);

  const unregisterCommand = useCallback((id) => {
    commandRegistry.unregister(id);
  }, []);

  const executeCommand = useCallback(
    async (id, payload = {}, event = null) => {
      const context = {
        user,
        pathname,
        router,
        activeScopes,
        ...payload,
      };
      return commandRegistry.execute(id, context, event);
    },
    [user, pathname, router, activeScopes]
  );

  // Global Keydown Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Never steal browser reserved shortcuts (Ctrl+W, Ctrl+T, Ctrl+R, F5, etc.)
      if (isBrowserReserved(e)) return;

      const isEditable = isEditableTarget(e.target, e);

      // 2. Handle Escape
      if (e.key === "Escape") {
        if (paletteOpen) {
          e.preventDefault();
          closePalette();
          return;
        }
        if (shortcutsModalOpen) {
          e.preventDefault();
          closeShortcutsModal();
          return;
        }
        // Dismiss topmost overlay from stack if one exists
        if (overlayStack.hasOverlays()) {
          e.preventDefault();
          overlayStack.dismissTop();
          return;
        }

        // If no overlays, check if an enabled selection clear command exists
        const clearCmd = commandRegistry.findMatching(
          e,
          activeScopes,
          isEditable,
          { user, pathname, router }
        );
        if (clearCmd) {
          e.preventDefault();
          executeCommand(clearCmd.id, {}, e);
          return;
        }
        return;
      }

      // 3. Command Palette trigger: Ctrl/Cmd + K
      if (matchShortcut(e, "$mod+k")) {
        e.preventDefault();
        if (paletteOpen) {
          closePalette();
        } else {
          openPalette();
        }
        return;
      }

      // 4. Keyboard Shortcuts Modal trigger: "?" (Shift + /) outside editable fields
      if ((e.key === "?" || (e.shiftKey && e.key === "/")) && !isEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (shortcutsModalOpen) {
          closeShortcutsModal();
        } else {
          openShortcutsModal();
        }
        return;
      }

      // 5. Look for registered commands matching this key event
      const context = {
        user,
        pathname,
        router,
        activeScopes,
      };

      const matching = commandRegistry.findMatching(e, activeScopes, isEditable, context);
      if (matching) {
        // Prevent default only if a valid command was claimed and is enabled
        if (matching.isEnabled(context)) {
          e.preventDefault();
          executeCommand(matching.id, {}, e);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    paletteOpen,
    shortcutsModalOpen,
    activeScopes,
    user,
    pathname,
    router,
    closePalette,
    openPalette,
    closeShortcutsModal,
    openShortcutsModal,
    executeCommand,
  ]);

  // Register standard global navigation commands based on user permissions
  useEffect(() => {
    const unregs = [];

    // Global navigation commands
    const navItems = [
      { id: "nav.home", title: "Go to Home", path: "/", role: null, keywords: ["landing", "main"] },
      { id: "nav.courses", title: "Browse Courses", path: "/courses", role: null, keywords: ["find", "training"] },
      { id: "nav.schedule", title: "View Schedule", path: "/schedule", role: null, keywords: ["calendar", "dates", "intakes"] },
      { id: "nav.registration", title: "Candidate Registration", path: "/registration", role: null, keywords: ["register", "enroll", "signup"] },
      { id: "nav.contact", title: "Contact Us", path: "/contact-us", role: null, keywords: ["support", "enquiry"] },
    ];

    if (user?.role === "owner") {
      navItems.push(
        { id: "nav.owner", title: "Owner Main Panel", path: "/owner", role: "owner", keywords: ["admin", "dashboard"] },
        { id: "nav.owner.organizations", title: "Manage Organizations", path: "/owner/organizations", role: "owner", keywords: ["atc", "centers"] },
        { id: "nav.owner.users", title: "Manage Users", path: "/owner/users", role: "owner", keywords: ["accounts", "funds"] },
        { id: "nav.owner.default-courses", title: "Manage Default Courses", path: "/owner/default-course/all", role: "owner", keywords: ["catalog", "courses"] },
        { id: "nav.owner.enquiries", title: "View Enquiries", path: "/owner/enquiries", role: "owner", keywords: ["messages", "contact"] },
        { id: "nav.owner.training.levels", title: "Training Levels", path: "/owner/training/levels", role: "owner", keywords: ["levels", "education"] },
        { id: "nav.owner.training.bodies", title: "Awarding Bodies", path: "/owner/training/awarding-bodies", role: "owner", keywords: ["qualifications"] },
        { id: "nav.owner.registrations", title: "Candidate Registrations", path: "/owner/registrations", role: "owner", keywords: ["enrollments", "receipts"] },
        { id: "nav.owner.cms", title: "Website CMS & Pages", path: "/owner/cms", role: "owner", keywords: ["builder", "sections", "theme"] },
        { id: "nav.owner.cms.variables", title: "CMS Variables & Data", path: "/owner/cms/variables", role: "owner", keywords: ["tokens", "query"] },
        { id: "nav.owner.scroll-animations", title: "Scroll Animations Workbench", path: "/owner/scroll-animations", role: "owner", keywords: ["video", "frames"] },
        { id: "nav.owner.pdf-templates", title: "PDF Templates", path: "/owner/pdf-template", role: "owner", keywords: ["certificates", "id cards"] }
      );
    } else if (user?.role === "admin") {
      navItems.push(
        { id: "nav.admin", title: "Admin Panel", path: "/admin", role: "admin", keywords: ["dashboard", "metrics"] },
        { id: "nav.admin.organizations", title: "Organizations", path: "/admin/organizations", role: "admin", keywords: ["atc", "centers"] },
        { id: "nav.admin.default-courses", title: "Default Courses", path: "/admin/default-course/all", role: "admin", keywords: ["courses"] },
        { id: "nav.admin.enquiries", title: "Enquiries", path: "/admin/enquiries", role: "admin", keywords: ["messages"] }
      );
    } else if (user) {
      // Organization / ATC user
      navItems.push(
        { id: "nav.dashboard", title: "Dashboard Overview", path: "/dashboard", role: "user", keywords: ["overview", "home"] },
        { id: "nav.dashboard.courses.new", title: "Create Course Reference", path: "/dashboard/course-reference/new", role: "user", keywords: ["new reference", "add batch"] },
        { id: "nav.dashboard.courses.all", title: "All Course References", path: "/dashboard/course-reference/all", role: "user", keywords: ["references", "candidates", "batches"] },
        { id: "nav.profile", title: "Organization Profile", path: "/profile", role: "user", keywords: ["account", "atc", "signature"] }
      );
    }

    navItems.forEach((item) => {
      unregs.push(
        commandRegistry.register({
          id: item.id,
          title: item.title,
          category: CommandCategory.NAVIGATION,
          keywords: item.keywords,
          scope: CommandScope.GLOBAL,
          run: () => {
            router.push(item.path);
          },
        })
      );
    });

    // Register Help and Palette Commands
    unregs.push(
      commandRegistry.register({
        id: "global.palette",
        title: "Open Command Palette",
        category: CommandCategory.HELP,
        keywords: ["palette", "search", "find", "menu", "command"],
        shortcut: "$mod+k",
        scope: CommandScope.GLOBAL,
        allowInEditable: true,
        run: () => openPalette(),
      })
    );

    unregs.push(
      commandRegistry.register({
        id: "global.shortcuts-help",
        title: "Keyboard Shortcuts Reference",
        category: CommandCategory.HELP,
        keywords: ["help", "shortcuts", "hotkeys", "keys", "commands"],
        shortcut: "?",
        scope: CommandScope.GLOBAL,
        allowInEditable: false,
        run: () => openShortcutsModal(),
      })
    );

    return () => {
      unregs.forEach((fn) => fn());
    };
  }, [user, router, openPalette, openShortcutsModal]);

  const value = useMemo(
    () => ({
      commandRegistry,
      registerCommand,
      unregisterCommand,
      executeCommand,
      activeScopes,
      pushScope,
      popScope,
      pushOverlay,
      popOverlay,
      paletteOpen,
      openPalette,
      closePalette,
      paletteInitialQuery,
      shortcutsModalOpen,
      openShortcutsModal,
      closeShortcutsModal,
      formatShortcut,
      isMac: isMac(),
      registryVersion,
    }),
    [
      registerCommand,
      unregisterCommand,
      executeCommand,
      activeScopes,
      pushScope,
      popScope,
      pushOverlay,
      popOverlay,
      paletteOpen,
      openPalette,
      closePalette,
      paletteInitialQuery,
      shortcutsModalOpen,
      openShortcutsModal,
      closeShortcutsModal,
      registryVersion,
    ]
  );

  return <CommandContext.Provider value={value}>{children}</CommandContext.Provider>;
}

const fallbackContext = {
  registerCommand: (cmd) => commandRegistry.register(cmd),
  unregisterCommand: (id) => commandRegistry.unregister(id),
  executeCommand: (id, context, event) => commandRegistry.execute(id, context, event),
  activeScopes: [CommandScope.GLOBAL, CommandScope.PAGE],
  pushScope: () => {},
  popScope: () => {},
  pushOverlay: (id, dismiss) => overlayStack.push(id, dismiss),
  popOverlay: (id) => overlayStack.pop(id),
  paletteOpen: false,
  openPalette: () => {},
  closePalette: () => {},
  paletteInitialQuery: "",
  shortcutsModalOpen: false,
  openShortcutsModal: () => {},
  closeShortcutsModal: () => {},
  formatShortcut: (s) => s,
  isMac: isMac(),
  registryVersion: 0,
};

export function useCommand() {
  const ctx = useContext(CommandContext);
  return ctx || fallbackContext;
}

/**
 * Hook to register and sync application commands.
 * Handles lifecycle cleanup and updates registry with latest closures.
 */
export function useCommands(commands = []) {
  const cmd = useCommand();
  const commandsRef = useRef(commands);
  commandsRef.current = commands;

  // Keep registry updated with latest execute handlers and enabled flags
  useEffect(() => {
    if (!Array.isArray(commands)) return;
    commands.forEach((c) => {
      if (c && c.id) {
        cmd.registerCommand(c);
      }
    });
  });

  // Unregister on unmount
  useEffect(() => {
    return () => {
      if (Array.isArray(commandsRef.current)) {
        commandsRef.current.forEach((c) => {
          if (c && c.id) {
            cmd.unregisterCommand(c.id);
          }
        });
      }
    };
  }, [cmd]);
}
