"use client";

import { type KeyboardEvent, useEffect, useId, useMemo, useState } from "react";
import { provinces } from "@/lib/localities/provinces";
import { schoolTypeLabel, type RegistrationSchool } from "@/lib/schools/directory";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

type SchoolPickerProps = {
  disabled?: boolean;
  label?: string;
  onSelect: (school: RegistrationSchool | null) => void;
  selectedSchool: RegistrationSchool | null;
};

export function SchoolPicker({ disabled = false, label = "Trường đang công tác", onSelect, selectedSchool }: SchoolPickerProps) {
  const client = useMemo(() => isSupabaseConfigured() ? createBrowserSupabaseClient() : null, []);
  const provinceId = useId();
  const inputId = useId();
  const listboxId = useId();
  const [province, setProvince] = useState(selectedSchool?.tinh_thanh ?? "");
  const [query, setQuery] = useState(selectedSchool?.ten ?? "");
  const [schools, setSchools] = useState<RegistrationSchool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!province || !client) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const { data, error: searchError } = await client.rpc("fn_danh_sach_truong_dang_ky", {
        p_limit: 20,
        p_tinh_thanh: province,
        p_tu_khoa: query.trim() || null,
      });
      if (!active) return;
      setSchools(searchError ? [] : (data ?? []) as RegistrationSchool[]);
      setError(searchError ? "Không tìm được danh mục trường. Vui lòng thử lại." : "");
      setLoading(false);
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [client, province, query]);

  const chooseSchool = (school: RegistrationSchool) => {
    onSelect(school);
    setQuery(school.ten);
    setOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(schools.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter" && open && schools[activeIndex]) {
      event.preventDefault();
      chooseSchool(schools[activeIndex]);
      return;
    }
    if (event.key === "Escape") setOpen(false);
  };

  return (
    <div className="grid gap-4">
      <label className="block text-sm font-medium text-[var(--color-charcoal)]" htmlFor={provinceId}>
        Tỉnh/thành phố
        <select
          className="form-control mt-2"
          disabled={disabled}
          id={provinceId}
          value={province}
          onChange={(event) => {
            setProvince(event.target.value);
            setQuery("");
            setSchools([]);
            setError("");
            setOpen(false);
            onSelect(null);
          }}
        >
          <option value="">Chọn tỉnh/thành phố</option>
          {provinces.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
        </select>
      </label>

      <div className="relative" onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}>
        <label className="block text-sm font-medium text-[var(--color-charcoal)]" htmlFor={inputId}>
          {label}
        </label>
        <div className="relative mt-2">
          <input
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-invalid={Boolean(error)}
            autoComplete="off"
            className="form-control pr-12"
            disabled={disabled || !province}
            id={inputId}
            placeholder={province ? "Nhập tên trường, mã trường hoặc phường/xã" : "Chọn tỉnh/thành phố trước"}
            role="combobox"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSchools([]);
              setActiveIndex(0);
              setOpen(true);
              if (selectedSchool) onSelect(null);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
          {selectedSchool ? (
            <button
              aria-label="Xóa trường đã chọn"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-xl text-[var(--color-graphite)] hover:text-[var(--color-ink-navy)]"
              title="Xóa trường đã chọn"
              type="button"
              onClick={() => {
                onSelect(null);
                setQuery("");
                setOpen(true);
              }}
            >×</button>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p> : null}

        {open ? (
          <div
            className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-[var(--radius-medium)] border border-[var(--color-border)] bg-white p-1 shadow-xl"
            id={listboxId}
            role="listbox"
          >
            {loading ? (
              <p className="px-3 py-4 text-sm text-[var(--color-graphite)]">Đang tìm trường…</p>
            ) : schools.length > 0 ? (
              schools.map((school, index) => (
                <button
                  aria-selected={school.id === selectedSchool?.id}
                  className={`block w-full rounded-[6px] px-3 py-3 text-left transition-colors ${
                    index === activeIndex || school.id === selectedSchool?.id
                      ? "bg-[var(--color-pale-cobalt)]"
                      : "hover:bg-[var(--color-paper-warm)]"
                  }`}
                  key={school.id}
                  role="option"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => chooseSchool(school)}
                >
                  <span className="block font-semibold text-[var(--color-ink-navy)]">{school.ten}</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-graphite)]/75">
                    Mã {school.ma_truong} · {[school.phuong_xa, school.tinh_thanh].filter(Boolean).join(", ")} · {schoolTypeLabel(school)}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-sm text-[var(--color-graphite)]">Không tìm thấy trường phù hợp tại {province}.</p>
            )}
          </div>
        ) : null}

        {selectedSchool && !open ? (
          <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]/75">
            Mã {selectedSchool.ma_truong} · {[selectedSchool.phuong_xa, selectedSchool.tinh_thanh].filter(Boolean).join(", ")} · {schoolTypeLabel(selectedSchool)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
