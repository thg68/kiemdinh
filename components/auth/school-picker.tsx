"use client";

import { KeyboardEvent, useId, useMemo, useState } from "react";
import {
  filterRegistrationSchools,
  schoolTypeLabel,
  type RegistrationSchool,
} from "@/lib/schools/directory";

type SchoolPickerProps = {
  disabled?: boolean;
  error?: string;
  label?: string;
  loading?: boolean;
  onSelect: (schoolId: string) => void;
  schools: RegistrationSchool[];
  selectedSchoolId: string;
};

export function SchoolPicker({
  disabled = false,
  error = "",
  label = "Trường đang công tác",
  loading = false,
  onSelect,
  schools,
  selectedSchoolId,
}: SchoolPickerProps) {
  const inputId = useId();
  const listboxId = useId();
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? null;
  const [query, setQuery] = useState(selectedSchool?.ten ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const results = useMemo(
    () => filterRegistrationSchools(schools, selectedSchool && query === selectedSchool.ten ? "" : query),
    [query, schools, selectedSchool],
  );

  function chooseSchool(school: RegistrationSchool) {
    onSelect(school.id);
    setQuery(school.ten);
    setOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && open && results[activeIndex]) {
      event.preventDefault();
      chooseSchool(results[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
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
          aria-owns={listboxId}
          autoComplete="off"
          className="form-control pr-12"
          disabled={disabled || loading}
          id={inputId}
          placeholder={loading ? "Đang tải danh sách trường…" : "Nhập tên trường, mã trường hoặc phường/xã"}
          role="combobox"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
            if (selectedSchoolId) onSelect("");
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
              onSelect("");
              setQuery("");
              setOpen(true);
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p> : null}

      {open && !loading ? (
        <div
          className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-[var(--radius-medium)] border border-[var(--color-border)] bg-white p-1 shadow-xl"
          id={listboxId}
          role="listbox"
        >
          {results.length > 0 ? (
            results.map((school, index) => (
              <button
                aria-selected={school.id === selectedSchoolId}
                className={`block w-full rounded-[6px] px-3 py-3 text-left transition-colors ${
                  index === activeIndex || school.id === selectedSchoolId
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
                  Mã {school.ma_truong} · {school.phuong_xa ?? "Quảng Ninh"} · {schoolTypeLabel(school)}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-[var(--color-graphite)]">
              Không tìm thấy trường phù hợp trong danh mục Quảng Ninh.
            </p>
          )}
        </div>
      ) : null}

      {selectedSchool && !open ? (
        <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]/75">
          Mã {selectedSchool.ma_truong} · {selectedSchool.phuong_xa ?? "Quảng Ninh"} · {schoolTypeLabel(selectedSchool)}
        </p>
      ) : null}
    </div>
  );
}
