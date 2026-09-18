import { matchShortcut } from "./keyboard";

/**
 * Command categories
 */
export const CommandCategory = {
  NAVIGATION: "Navigation",
  SELECTION: "Selection",
  EDITING: "Editing",
  ACTIONS: "Actions",
  VIEW: "View",
  HELP: "Help",
};

/**
 * Command Scopes (in priority order: editor/modal/table > page > global)
 */
export const CommandScope = {
  GLOBAL: "global",
  PAGE: "page",
  TABLE: "table",
  FORM: "form",
  MODAL: "modal",
  EDITOR: "editor",
};

export class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.listeners = new Set();
  }

  /**
   * Register a command.
   * @param {Object} commandDefinition
   * @returns {Function} Unregister function
   */
  register(commandDefinition) {
    if (!commandDefinition || !commandDefinition.id) {
      console.warn("Attempted to register invalid command:", commandDefinition);
      return () => {};
    }

    const normalized = {
      id: commandDefinition.id,
      title: commandDefinition.title || commandDefinition.id,
      description: commandDefinition.description || "",
      keywords: Array.isArray(commandDefinition.keywords) ? commandDefinition.keywords : [],
      category: commandDefinition.category || CommandCategory.ACTIONS,
      scope: commandDefinition.scope || CommandScope.GLOBAL,
      shortcut: commandDefinition.shortcut || null,
      allowInEditable: Boolean(commandDefinition.allowInEditable),
      isDestructive: Boolean(commandDefinition.isDestructive),
      repeatable: Boolean(commandDefinition.repeatable),
      disabledReason: commandDefinition.disabledReason || "",
      isAvailable: typeof commandDefinition.isAvailable === "function" ? commandDefinition.isAvailable : () => true,
      isEnabled: typeof commandDefinition.isEnabled === "function" ? commandDefinition.isEnabled : () => true,
      run: typeof commandDefinition.run === "function" ? commandDefinition.run : () => {},
    };

    this.commands.set(normalized.id, normalized);
    this.notify();

    return () => this.unregister(normalized.id);
  }

  /**
   * Unregister a command by ID.
   */
  unregister(id) {
    if (this.commands.has(id)) {
      this.commands.delete(id);
      this.notify();
    }
  }

  /**
   * Retrieve a command by ID.
   */
  get(id) {
    return this.commands.get(id);
  }

  /**
   * Retrieve all commands.
   */
  getAll() {
    return Array.from(this.commands.values());
  }

  /**
   * Retrieve available commands for the current context.
   */
  getAvailable(context = {}) {
    return this.getAll().filter((cmd) => {
      try {
        return cmd.isAvailable(context);
      } catch (err) {
        console.error(`Error checking availability for command ${cmd.id}:`, err);
        return false;
      }
    });
  }

  /**
   * Find a command matching the current keyboard event, taking into account
   * active scope, whether focus is in an editable target, and command enablement.
   */
  findMatching(event, activeScopes = [CommandScope.GLOBAL], isEditable = false, context = {}) {
    const candidates = [];

    for (const cmd of this.commands.values()) {
      if (!cmd.shortcut) continue;

      // Check if the event keys match
      if (!matchShortcut(event, cmd.shortcut)) continue;

      // If typing inside an input/editor, command must explicitly allow it (e.g. Save)
      if (isEditable && !cmd.allowInEditable) continue;

      // If key is being held down (repeat) and command is not repeatable, skip
      if (event.repeat && !cmd.repeatable) continue;

      // Check availability and scope
      const matchesScope =
        cmd.scope === CommandScope.GLOBAL ||
        activeScopes.includes(cmd.scope) ||
        (Array.isArray(cmd.scope) && cmd.scope.some((s) => activeScopes.includes(s)));

      if (!matchesScope) continue;

      try {
        if (cmd.isAvailable(context)) {
          candidates.push(cmd);
        }
      } catch {
        // Ignore errors during candidate matching
      }
    }

    if (candidates.length === 0) return null;

    // Sort by scope priority: specific scopes (modal, editor, table, form) take precedence over page, then global
    const scopePriority = {
      [CommandScope.EDITOR]: 5,
      [CommandScope.MODAL]: 4,
      [CommandScope.TABLE]: 3,
      [CommandScope.FORM]: 3,
      [CommandScope.PAGE]: 2,
      [CommandScope.GLOBAL]: 1,
    };

    candidates.sort((a, b) => {
      const pA = scopePriority[a.scope] || 2;
      const pB = scopePriority[b.scope] || 2;
      return pB - pA;
    });

    return candidates[0];
  }

  /**
   * Execute a command by ID.
   */
  async execute(id, context = {}, event = null) {
    const cmd = this.get(id);
    if (!cmd) {
      console.warn(`Command "${id}" not found.`);
      return false;
    }

    if (!cmd.isAvailable(context)) {
      console.warn(`Command "${id}" is not available in current context.`);
      return false;
    }

    if (!cmd.isEnabled(context)) {
      const reason = cmd.disabledReason || "This action is currently disabled.";
      console.warn(`Command "${id}" is disabled: ${reason}`);
      return false;
    }

    try {
      await cmd.run(context, event);
      return true;
    } catch (err) {
      console.error(`Execution failed for command "${id}":`, err);
      return false;
    }
  }

  /**
   * Subscribe to registry changes.
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error("Error notifying command registry listener:", e);
      }
    }
  }
}

export const commandRegistry = new CommandRegistry();
