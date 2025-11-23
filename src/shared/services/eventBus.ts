// Simple event bus for in-app notifications between components
type Callback = (payload?: any) => void;

class EventBus {
  private listeners: Map<string, Set<Callback>> = new Map();

  on(event: string, cb: Callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.off(event, cb);
  }

  off(event: string, cb: Callback) {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(cb);
    if (set.size === 0) this.listeners.delete(event);
  }

  emit(event: string, payload?: any) {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((cb) => {
      try { cb(payload); } catch { /* swallow */ }
    });
  }
}

export const eventBus = new EventBus();

export default eventBus;
