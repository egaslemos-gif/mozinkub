"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  dayKey,
  eventCategoryLabel,
  monthLabel,
  WEEKDAYS_PT,
  type CalendarEntry,
} from "@/lib/calendar";

function startOfMonthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, monthIndex, 1 - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const mondayOffset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return d;
}

function endOfWeek(date: Date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLong(date: Date) {
  return date.toLocaleDateString("pt-MZ", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatWeekRange(start: Date) {
  const end = endOfWeek(start);
  const a = start.toLocaleDateString("pt-MZ", { day: "2-digit", month: "short" });
  const b = end.toLocaleDateString("pt-MZ", { day: "2-digit", month: "short", year: "numeric" });
  return `${a} — ${b}`;
}

type FocusMode = "month" | "week" | "day";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: new Date(2026, i, 1).toLocaleDateString("pt-MZ", { month: "long" }),
}));

export function MonthCalendar({ entries }: { entries: CalendarEntry[] }) {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>("month");
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(dayKey(today));
  const [detail, setDetail] = useState<CalendarEntry | null>(null);

  const yearOptions = useMemo(() => {
    const years = new Set<number>([today.getFullYear()]);
    for (const e of entries) {
      years.add(new Date(e.startsAt).getFullYear());
    }
    // Intervalo para percorrer histórico e agendas futuras
    const minY = Math.min(...years, today.getFullYear() - 3);
    const maxY = Math.max(...years, today.getFullYear() + 2);
    const list: number[] = [];
    for (let y = minY; y <= maxY; y++) list.push(y);
    return list;
  }, [entries, today]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      const key = dayKey(new Date(e.startsAt));
      const list = map.get(key) || [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const cells = useMemo(() => {
    const start = startOfMonthGrid(year, month);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [year, month]);

  const selectedDate = useMemo(() => {
    if (!selectedDayKey) return today;
    const [y, m, d] = selectedDayKey.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDayKey, today]);

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);

  const panelEntries = useMemo(() => {
    if (focusMode === "day") {
      return byDay.get(selectedDayKey || dayKey(today)) || [];
    }
    if (focusMode === "week") {
      const start = weekStart.getTime();
      const end = endOfWeek(weekStart).getTime();
      return entries.filter((e) => {
        const t = new Date(e.startsAt).getTime();
        return t >= start && t <= end;
      });
    }
    return entries.filter((e) => {
      const d = new Date(e.startsAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [focusMode, byDay, selectedDayKey, today, weekStart, entries, year, month]);

  const panelTitle = useMemo(() => {
    if (focusMode === "day") return formatDayLong(selectedDate);
    if (focusMode === "week") return `Semana · ${formatWeekRange(weekStart)}`;
    return `Mês · ${monthLabel(year, month)}`;
  }, [focusMode, selectedDate, weekStart, year, month]);

  const prevMonthDate = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const nextMonthDate = useMemo(() => new Date(year, month + 1, 1), [year, month]);

  const countInMonth = (y: number, m: number) =>
    entries.filter((e) => {
      const d = new Date(e.startsAt);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;

  function goToMonth(y: number, m: number) {
    setDetail(null);
    setYear(y);
    setMonth(m);
    setSelectedDayKey(dayKey(new Date(y, m, 1)));
    setFocusMode("month");
  }

  function prevMonth() {
    const d = new Date(year, month - 1, 1);
    goToMonth(d.getFullYear(), d.getMonth());
  }

  function nextMonth() {
    const d = new Date(year, month + 1, 1);
    goToMonth(d.getFullYear(), d.getMonth());
  }

  function goToday() {
    setDetail(null);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDayKey(dayKey(today));
    setFocusMode("day");
  }

  function onSelectDay(date: Date) {
    const key = dayKey(date);
    setSelectedDayKey(key);
    setFocusMode("day");
    setDetail(null);
    if (date.getMonth() !== month || date.getFullYear() !== year) {
      setMonth(date.getMonth());
      setYear(date.getFullYear());
    }
  }

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] text-primary uppercase">Calendário</p>
          <h2 className="font-display mt-0.5 text-xl font-semibold sm:text-2xl">
            {monthLabel(year, month)}
          </h2>
        </div>

        <div className="flex flex-col gap-1.5 sm:items-end">
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="sr-only" htmlFor="cal-month">
              Mês
            </label>
            <select
              id="cal-month"
              className="admin-input !w-auto !py-1.5 text-xs capitalize sm:text-sm"
              value={month}
              onChange={(e) => goToMonth(year, Number(e.target.value))}
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value} className="capitalize">
                  {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="cal-year">
              Ano
            </label>
            <select
              id="cal-year"
              className="admin-input !w-auto !py-1.5 text-xs sm:text-sm"
              value={year}
              onChange={(e) => goToMonth(Number(e.target.value), month)}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="btn-ghost !px-2.5 !py-1.5 text-[11px] sm:text-xs"
              onClick={prevMonth}
              title={monthLabel(prevMonthDate.getFullYear(), prevMonthDate.getMonth())}
            >
              ← {prevMonthDate.toLocaleDateString("pt-MZ", { month: "short", year: "numeric" })}
              {countInMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth()) > 0
                ? ` (${countInMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth())})`
                : ""}
            </button>
            <button
              type="button"
              className={`btn-ghost !px-2.5 !py-1.5 text-[11px] sm:text-xs ${
                isCurrentMonth ? "border-primary text-primary" : ""
              }`}
              onClick={goToday}
            >
              Hoje
            </button>
            <button
              type="button"
              className="btn-ghost !px-2.5 !py-1.5 text-[11px] sm:text-xs"
              onClick={nextMonth}
              title={monthLabel(nextMonthDate.getFullYear(), nextMonthDate.getMonth())}
            >
              {nextMonthDate.toLocaleDateString("pt-MZ", { month: "short", year: "numeric" })} →
              {countInMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth()) > 0
                ? ` (${countInMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth())})`
                : ""}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 grid items-start gap-3 lg:grid-cols-[1.15fr_0.85fr] lg:gap-4">
        {/* Grelha compacta — células com altura fixa (não aspect-square) */}
        <div className="card-surface overflow-hidden p-2 sm:p-2.5">
          <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-muted">
            {WEEKDAYS_PT.map((d) => (
              <div key={d} className="py-0.5">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date) => {
              const inMonth = date.getMonth() === month;
              const key = dayKey(date);
              const dayItems = byDay.get(key) || [];
              const isToday = sameDay(date, today);
              const isSelected = selectedDayKey === key;
              const primary = dayItems[0];
              const showHover = hoverId === key && dayItems.length > 0 && !isSelected;

              return (
                <div
                  key={key}
                  className="relative"
                  onMouseEnter={() => dayItems.length && setHoverId(key)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDay(date)}
                    className={`flex h-9 w-full flex-col items-center justify-center border px-0.5 text-center transition sm:h-10 ${
                      inMonth ? "bg-white" : "bg-transparent text-muted/40"
                    } ${
                      isSelected
                        ? "border-primary bg-primary-soft"
                        : isToday
                          ? "border-primary/50"
                          : "border-border/60"
                    } ${dayItems.length ? "hover:border-primary" : "hover:bg-[#f7fafc]"}`}
                  >
                    <span
                      className={`text-[11px] font-semibold leading-none sm:text-xs ${
                        isSelected || isToday ? "text-primary" : ""
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="mt-0.5 flex max-w-full justify-center gap-0.5">
                        {dayItems.slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            className={`h-1 w-1 ${
                              item.kind === "EVENTO" ? "bg-primary" : "bg-ul-blue"
                            }`}
                          />
                        ))}
                      </span>
                    )}
                  </button>

                  {showHover && primary && (
                    <div className="pointer-events-none absolute top-full left-1/2 z-30 mt-1 hidden w-44 -translate-x-1/2 border border-border bg-white p-2 shadow-lg md:block">
                      <p className="text-[10px] font-bold text-primary uppercase">
                        {eventCategoryLabel(primary.category)}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold leading-snug">{primary.title}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted">{primary.summary}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-muted">
            Verde = eventos · azul = actividades. Clique no dia para filtrar o resumo.
          </p>
        </div>

        {/* Painel resumo */}
        <aside className="card-surface sticky top-20 flex max-h-[min(52vh,22rem)] flex-col overflow-hidden lg:max-h-[22rem]">
          <div className="border-b border-border p-2.5">
            <div className="flex gap-1 bg-[#eef2f0] p-0.5">
              {(
                [
                  { id: "month" as const, label: "Mês" },
                  { id: "week" as const, label: "Semana" },
                  { id: "day" as const, label: "Dia" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFocusMode(tab.id);
                    setDetail(null);
                    if (tab.id !== "month" && !selectedDayKey) {
                      setSelectedDayKey(dayKey(today));
                    }
                  }}
                  className={`flex-1 px-2 py-1 text-[11px] font-semibold transition ${
                    focusMode === tab.id
                      ? "bg-primary text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-semibold text-primary capitalize">{panelTitle}</p>
            <p className="text-[10px] text-muted">
              {panelEntries.length}{" "}
              {panelEntries.length === 1 ? "registo" : "registos"} neste período
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5">
            {detail ? (
              <div>
                <button
                  type="button"
                  className="mb-2 text-[11px] font-semibold text-primary"
                  onClick={() => setDetail(null)}
                >
                  ← Voltar ao resumo
                </button>
                {detail.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.coverUrl}
                    alt=""
                    className="mb-2 h-24 w-full object-cover"
                  />
                )}
                <p className="text-[10px] font-bold tracking-wide text-primary uppercase">
                  {eventCategoryLabel(detail.category)} ·{" "}
                  {detail.kind === "EVENTO" ? "Evento" : "Actividade"}
                </p>
                <h3 className="font-display mt-0.5 text-lg font-semibold leading-snug">
                  {detail.title}
                </h3>
                <p className="mt-1 text-[11px] text-muted">
                  {new Date(detail.startsAt).toLocaleString("pt-MZ", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {detail.location ? ` · ${detail.location}` : ""}
                </p>
                <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted">
                  {detail.summary}
                </p>
                <Link href={detail.href} className="btn-primary mt-3 inline-flex !py-1.5 text-xs">
                  Página completa →
                </Link>
              </div>
            ) : panelEntries.length === 0 ? (
              <p className="text-xs text-muted">
                Sem registos neste período. Seleccione outro dia ou mude o filtro.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {panelEntries.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setDetail(item)}
                      className="flex w-full gap-2 border border-border bg-white p-2 text-left transition hover:border-primary hover:bg-primary-soft/40"
                    >
                      <div className="h-9 w-9 shrink-0 overflow-hidden bg-primary-soft">
                        {item.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.coverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-[10px] font-bold text-primary">
                            {new Date(item.startsAt).getDate()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-primary">
                          {new Date(item.startsAt).toLocaleDateString("pt-MZ", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                          {" · "}
                          {eventCategoryLabel(item.category)}
                        </p>
                        <p className="truncate text-xs font-semibold">{item.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{item.summary}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
