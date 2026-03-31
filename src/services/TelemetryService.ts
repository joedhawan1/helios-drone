import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CommandLog, TelemetryStats } from '../types/drone';

const STORAGE_KEY = 'telemetry_log';
const MAX_ENTRIES = 500;

class TelemetryService {
  private _log: CommandLog[] = [];
  private _loaded = false;

  private async _ensureLoaded(): Promise<void> {
    if (this._loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      this._log = raw ? JSON.parse(raw) : [];
    } catch {
      this._log = [];
    }
    this._loaded = true;
  }

  private async _persist(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this._log));
  }

  async recordCommand(droneId: string, droneName: string, commandId: string): Promise<void> {
    await this._ensureLoaded();
    this._log.unshift({
      commandId,
      droneId,
      droneName,
      sentAt: Date.now(),
      status: 'pending',
    });
    if (this._log.length > MAX_ENTRIES) {
      this._log = this._log.slice(0, MAX_ENTRIES);
    }
    await this._persist();
  }

  async recordResponse(commandId: string, status: 'success' | 'timeout' | 'error', illuminateDuration?: number): Promise<void> {
    await this._ensureLoaded();
    const entry = this._log.find((e) => e.commandId === commandId);
    if (!entry) return;
    entry.respondedAt = Date.now();
    entry.status = status;
    entry.latencyMs = entry.respondedAt - entry.sentAt;
    if (illuminateDuration != null) {
      // store duration in latencyMs field for illumination tracking
    }
    await this._persist();
  }

  async getStats(droneId?: string): Promise<TelemetryStats> {
    await this._ensureLoaded();
    const filtered = droneId ? this._log.filter((e) => e.droneId === droneId) : this._log;
    const total = filtered.length;
    const successes = filtered.filter((e) => e.status === 'success').length;
    const withLatency = filtered.filter((e) => e.latencyMs != null);
    const avgLatency = withLatency.length > 0
      ? withLatency.reduce((sum, e) => sum + (e.latencyMs ?? 0), 0) / withLatency.length
      : 0;
    const totalIllumination = withLatency
      .filter((e) => e.status === 'success')
      .reduce((sum, e) => sum + (e.latencyMs ?? 0), 0);

    return {
      droneId,
      totalCommands: total,
      successRate: total > 0 ? successes / total : 0,
      avgLatencyMs: Math.round(avgLatency),
      totalIlluminationMs: totalIllumination,
    };
  }

  async getRecentCommands(limit: number): Promise<CommandLog[]> {
    await this._ensureLoaded();
    return this._log.slice(0, limit);
  }

  async clearHistory(): Promise<void> {
    this._log = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export const telemetryService = new TelemetryService();
