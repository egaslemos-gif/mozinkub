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
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Calendário</p>
          <h2 className="font-display mt-1 text-2xl font-semibold sm:text-3xl">
            {monthLabel(year, month)}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Percorra meses anteriores (histórico) ou seguintes (agendas futuras).
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="cal-month">
              Mês
            </label>
            <select
              id="cal-month"
              className="admin-input !w-auto !py-2 text-sm capitalize"
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
              className="admin-input !w-auto !py-2 text-sm"
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

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-ghost !px-3 !py-2 text-xs sm:text-sm"
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
              className={`btn-ghost !px-3 !py-2 text-xs sm:text-sm ${
                isCurrentMonth ? "border-primary text-primary" : ""
              }`}
              onClick={goToday}
            >
              Hoje
            </button>
            <button
              type="button"
              className="btn-ghost !px-3 !py-2 text-xs sm:text-sm"
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

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
        {/* Grelha */}
        <div className="card-surface overflow-hidden p-3 sm:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted sm:text-xs">
            {WEEKDAYS_PT.map((d) => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
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
                    className={`flex aspect-square w-full flex-col items-center rounded-lg border p-1 text-center transition sm:rounded-xl sm:p-1.5 ${
                      inMonth ? "bg-white" : "bg-transparent text-muted/40"
                    } ${
                      isSelected
                        ? "border-primary bg-primary-soft shadow-sm"
                        : isToday
                          ? "border-primary/50"
                          : "border-border/70"
                    } ${dayItems.length ? "hover:border-primary" : "hover:bg-[#f7fafc]"}`}
                  >
                    <span
                      className={`text-xs font-semibold sm:text-sm ${
                        isSelected || isToday ? "text-primary" : ""
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="mt-auto flex max-w-full flex-wrap justify-center gap-0.5 pb-0.5">
                        {dayItems.slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.kind === "EVENTO" ? "bg-primary" : "bg-ul-blue"
                            }`}
                          />
                        ))}
                      </span>
                    )}
                  </button>

                  {showHover && primary && (
                    <div className="pointer-events-none absolute top-full left-1/2 z-30 mt-1.5 hidden w-48 -translate-x-1/2 rounded-xl border border-border bg-white p-2 shadow-xl md:block">
                      {primary.coverUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={primary.coverUrl}
                          alt=""
                          className="mb-1.5 h-20 w-full rounded-lg object-cover"
                        />
                      )}
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
          <p className="mt-3 text-[11px] text-muted">
            Clique num dia para filtrar o resumo ao lado. Pontos verdes = eventos · azuis =
            actividades.
          </p>
        </div>

        {/* Painel resumo */}
        <aside className="card-surface sticky top-24 flex max-h-[min(70vh,36rem)] flex-col overflow-hidden lg:max-h-[32rem]">
          <div className="border-b border-border p-3 sm:p-4">
            <div className="flex gap-1 rounded-full bg-[#f3f7f4] p-1">
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
                  className={`flex-1 rounded-full px-2 py-1.5 text-xs font-semibold transition ${
                    focusMode === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold text-primary capitalize">{panelTitle}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {panelEntries.length}{" "}
              {panelEntries.length === 1 ? "registo" : "registos"} neste período
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {detail ? (
              <div>
                <button
                  type="button"
                  className="mb-3 text-xs font-semibold text-primary"
                  onClick={() => setDetail(null)}
                >
                  ← Voltar ao resumo
                </button>
                {detail.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.coverUrl}
                    alt=""
                    className="mb-3 h-36 w-full rounded-xl object-cover"
                  />
                )}
                <p className="text-[10px] font-bold tracking-wide text-primary uppercase">
                  {eventCategoryLabel(detail.category)} ·{" "}
                  {detail.kind === "EVENTO" ? "Evento" : "Actividade"}
                </p>
                <h3 className="font-display mt-1 text-xl font-semibold">{detail.title}</h3>
                <p className="mt-2 text-xs text-muted">
                  {new Date(detail.startsAt).toLocaleString("pt-MZ", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {detail.location ? ` · ${detail.location}` : ""}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{detail.summary}</p>
                {detail.details && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                    {detail.details}
                  </p>
                )}
                <Link href={detail.href} className="btn-primary mt-4 inline-flex !py-2 text-sm">
                  Página completa →
                </Link>
              </div>
            ) : panelEntries.length === 0 ? (
              <p className="text-sm text-muted">
                Sem actividades ou eventos neste período. Seleccione outro dia ou mude o filtro.
              </p>
            ) : (
              <ul className="space-y-2">
                {panelEntries.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setDetail(item)}
                      className="flex w-full gap-3 rounded-xl border border-border bg-white p-2.5 text-left transition hover:border-primary hover:bg-primary-soft/40"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-primary-soft">
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
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.summary}</p>
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
