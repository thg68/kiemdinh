import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AI_SESSION_STORAGE_KEY,
  activeAiProviderConfig,
  emptyAiSessionConfig,
  loadAiSessionConfig,
  saveAiSessionConfig,
} from "./session-config";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("cấu hình AI trong phiên", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal("window", { sessionStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tạo cấu hình mặc định riêng cho từng nhà cung cấp", () => {
    const config = emptyAiSessionConfig();

    expect(config.provider).toBe("openai");
    expect(config.providers.openai.model).toBe("gpt-5.4-mini");
    expect(config.providers.gemini.model).toBe("gemini-3.8-flash");
    expect(config.providers.claude.apiKey).toBe("");
  });

  it("chuyển cấu hình OpenAI cũ sang định dạng đa nhà cung cấp", () => {
    storage.setItem(AI_SESSION_STORAGE_KEY, JSON.stringify({
      apiKey: "legacy-openai-key",
      model: "gpt-5-mini",
    }));

    expect(activeAiProviderConfig(loadAiSessionConfig())).toEqual({
      provider: "openai",
      apiKey: "legacy-openai-key",
      model: "gpt-5-mini",
    });
  });

  it("giữ khóa và model riêng khi đổi nhà cung cấp", () => {
    const config = emptyAiSessionConfig();
    config.provider = "gemini";
    config.providers.openai.apiKey = "openai-key";
    config.providers.gemini = {
      apiKey: "gemini-key",
      model: "gemini-3.7-flash",
    };

    saveAiSessionConfig(config);
    const loaded = loadAiSessionConfig();

    expect(activeAiProviderConfig(loaded)).toEqual({
      provider: "gemini",
      apiKey: "gemini-key",
      model: "gemini-3.7-flash",
    });
    expect(loaded.providers.openai.apiKey).toBe("openai-key");
  });
});
