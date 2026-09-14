"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  PlugZap,
  Save,
  Trash2,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { requestAiConnectionTest } from "@/lib/ai/client";
import {
  AI_PROVIDER_CATALOG,
  getAiProviderDefinition,
} from "@/lib/ai/provider-catalog";
import {
  emptyAiSessionConfig,
  loadAiSessionConfig,
  saveAiSessionConfig,
  type AiSessionConfig,
} from "@/lib/ai/session-config";
import type { AiProvider } from "@/lib/ai/types";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

const MODEL_PATTERN = /^[A-Za-z0-9._:-]{1,80}$/;

type SettingsMessage = {
  text: string;
  tone: "success" | "warning";
};

export function AiSessionSettings({
  onMessage,
}: {
  onMessage?: (message: string) => void;
}) {
  const [config, setConfig] = useState<AiSessionConfig>(emptyAiSessionConfig);
  const [savedProviders, setSavedProviders] = useState<AiProvider[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<SettingsMessage | null>(null);

  const providerDefinition = getAiProviderDefinition(config.provider);
  const activeConfig = config.providers[config.provider];
  const configured = savedProviders.includes(config.provider);

  function notify(value: string, tone: SettingsMessage["tone"] = "warning") {
    setMessage({ text: value, tone });
    onMessage?.(value);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = loadAiSessionConfig();
      setConfig(saved);
      setSavedProviders(
        AI_PROVIDER_CATALOG
          .filter((provider) => Boolean(saved.providers[provider.id].apiKey))
          .map((provider) => provider.id),
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function updateActiveConfig(value: Partial<typeof activeConfig>) {
    setConfig((current) => ({
      ...current,
      providers: {
        ...current.providers,
        [current.provider]: {
          ...current.providers[current.provider],
          ...value,
        },
      },
    }));
  }

  function selectProvider(provider: AiProvider) {
    setConfig((current) => ({ ...current, provider }));
    setShowKey(false);
    setMessage(null);
  }

  function validateActiveConfig() {
    if (activeConfig.apiKey.trim().length < 8 || activeConfig.apiKey.trim().length > 512) {
      notify(`${providerDefinition.keyLabel} không hợp lệ.`);
      return false;
    }
    if (!MODEL_PATTERN.test(activeConfig.model.trim())) {
      notify("Tên mô hình AI không hợp lệ.");
      return false;
    }
    return true;
  }

  function save() {
    if (!validateActiveConfig()) return;

    saveAiSessionConfig(config);
    setSavedProviders((current) => (
      current.includes(config.provider) ? current : [...current, config.provider]
    ));
    notify(`Đã lưu cấu hình ${providerDefinition.label} trong tab hiện tại.`, "success");
  }

  function clear() {
    const nextConfig: AiSessionConfig = {
      ...config,
      providers: {
        ...config.providers,
        [config.provider]: {
          apiKey: "",
          model: providerDefinition.defaultModel,
        },
      },
    };
    saveAiSessionConfig(nextConfig);
    setConfig(nextConfig);
    setSavedProviders((current) => current.filter((provider) => provider !== config.provider));
    setShowKey(false);
    notify(`Đã xóa API key ${providerDefinition.label} khỏi phiên làm việc.`, "success");
  }

  async function testConnection() {
    if (!validateActiveConfig()) return;
    if (!isSupabaseConfigured()) {
      notify("Chưa cấu hình kết nối hệ thống.");
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (error || !accessToken) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      await requestAiConnectionTest(accessToken, {
        provider: config.provider,
        model: activeConfig.model.trim(),
        apiKey: activeConfig.apiKey.trim(),
      });
      notify(
        `Đã kết nối ${providerDefinition.label} bằng mô hình ${activeConfig.model.trim()}.`,
        "success",
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không kiểm tra được kết nối AI.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="surface-card overflow-hidden" aria-labelledby="ai-settings-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound aria-hidden="true" className="text-[var(--color-electric-cobalt)]" size={19} />
            <h2 className="text-base font-semibold text-[var(--color-ink-navy)]" id="ai-settings-title">
              Cấu hình trợ lý AI
            </h2>
          </div>
          <p className="mt-1 max-w-[62ch] text-sm leading-6 text-[var(--color-graphite)]/70">
            Khi tạo bản nháp, dữ liệu nghiệp vụ liên quan được gửi tới {providerDefinition.label}. API key chỉ được giữ trong tab hiện tại.
          </p>
        </div>
        {configured ? <StatusBadge tone="success">Đã cấu hình</StatusBadge> : null}
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-[minmax(170px,0.75fr)_minmax(280px,1.35fr)_minmax(220px,1fr)] xl:items-end">
        <label className="text-sm font-medium">
          Nhà cung cấp AI
          <select
            className="form-control mt-2"
            value={config.provider}
            onChange={(event) => selectProvider(event.target.value as AiProvider)}
          >
            {AI_PROVIDER_CATALOG.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          {providerDefinition.keyLabel}
          <span className="relative mt-2 block">
            <input
              autoComplete="off"
              className="form-control pr-11"
              placeholder="Nhập API key"
              spellCheck={false}
              type={showKey ? "text" : "password"}
              value={activeConfig.apiKey}
              onChange={(event) => updateActiveConfig({ apiKey: event.target.value })}
            />
            <button
              aria-label={showKey ? "Ẩn API key" : "Hiện API key"}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-[var(--color-graphite)]/65"
              title={showKey ? "Ẩn API key" : "Hiện API key"}
              type="button"
              onClick={() => setShowKey((current) => !current)}
            >
              {showKey ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
            </button>
          </span>
        </label>

        <label className="text-sm font-medium">
          Mô hình
          <input
            autoComplete="off"
            className="form-control mt-2"
            list={`ai-models-${config.provider}`}
            spellCheck={false}
            value={activeConfig.model}
            onChange={(event) => updateActiveConfig({ model: event.target.value })}
          />
          <datalist id={`ai-models-${config.provider}`}>
            {providerDefinition.models.map((model) => <option key={model} value={model} />)}
          </datalist>
        </label>

        <div className="flex flex-wrap justify-end gap-2 md:col-span-2 xl:col-span-3">
          <button
            className="button-secondary w-full whitespace-nowrap sm:w-auto"
            disabled={testing}
            type="button"
            onClick={() => void testConnection()}
          >
            {testing
              ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
              : <PlugZap aria-hidden="true" size={17} />}
            {testing ? "Đang kiểm tra" : "Kiểm tra kết nối"}
          </button>
          <button className="button-primary w-full whitespace-nowrap sm:w-auto" type="button" onClick={save}>
            <Save aria-hidden="true" size={17} />
            {configured ? "Cập nhật" : "Lưu cấu hình"}
          </button>
          {configured ? (
            <button
              aria-label="Xóa API key"
              className="button-secondary px-3"
              title="Xóa API key"
              type="button"
              onClick={clear}
            >
              <Trash2 aria-hidden="true" size={17} />
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="px-5 pb-5">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      ) : null}
    </section>
  );
}
