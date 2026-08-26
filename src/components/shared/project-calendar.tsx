'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval,
  format, isToday, isWeekend,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ProjectDetailContent } from '@/components/shared/project-detail-content';
import { Button } from '@/components/ui/button';
import type { Project, Status } from '@/lib/types';

const STATUS_BAR_COLORS: Record<string, string> = {
  active: 'bg-emerald-500 dark:bg-emerald-400',
  completed: 'bg-sky-500 dark:bg-sky-400',
  'on-hold': 'bg-amber-500 dark:bg-amber-400',
};

const STATUS_LABELS: Record<string, { status: Status; label: string }> = {
  active: { status: 'green', label: 'Active' },
  completed: { status: 'blue', label: 'Completed' },
  'on-hold': { status: 'orange', label: 'On Hold' },
};

type CalendarMode = 'week' | 'month' | 'year';

const MODES: { id: CalendarMode; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

const ROW_HEIGHT = 40;
const LABEL_WIDTH = 180;
const DAY_MS = 86400000;

interface CalendarColumn {
  key: string;
  startMs: number;
  endMs: number;
  top?: string;
  main: string;
  shaded?: boolean;
  dimmed?: boolean;
  today?: boolean;
}

interface ProjectCalendarProps {
  projects: Project[];
}

export function ProjectCalendar({ projects }: ProjectCalendarProps) {
  const openModal = useAppStore((s) => s.openModal);
  const [mode, setMode] = useState<CalendarMode>('month');
  const [cursor, setCursor] = useState(() => new Date());

  // ── Visible range + columns per mode ───────────────────────────
  const { rangeStartMs, rangeEndMs, columns, title, colMinWidth } = useMemo(() => {
    if (mode === 'week') {
      const s = startOfWeek(cursor, { weekStartsOn: 1 });
      const e = endOfWeek(cursor, { weekStartsOn: 1 });
      const cols: CalendarColumn[] = eachDayOfInterval({ start: s, end: e }).map((day) => ({
        key: day.toISOString(),
        startMs: day.getTime(),
        endMs: day.getTime() + DAY_MS,
        top: format(day, 'EEE'),
        main: format(day, 'd'),
        shaded: isWeekend(day),
        today: isToday(day),
      }));
      return {
        rangeStartMs: s.getTime(), rangeEndMs: e.getTime() + DAY_MS,
        columns: cols, title: `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`,
        colMinWidth: 36,
      };
    }

    if (mode === 'month') {
      const mStart = startOfMonth(cursor);
      const mEnd = endOfMonth(cursor);
      const s = startOfWeek(mStart, { weekStartsOn: 1 });
      const e = endOfWeek(mEnd, { weekStartsOn: 1 });
      const cols: CalendarColumn[] = eachDayOfInterval({ start: s, end: e }).map((day) => ({
        key: day.toISOString(),
        startMs: day.getTime(),
        endMs: day.getTime() + DAY_MS,
        top: format(day, 'EEE'),
        main: format(day, 'd'),
        shaded: isWeekend(day),
        dimmed: day.getMonth() !== cursor.getMonth(),
        today: isToday(day),
      }));
      return {
        rangeStartMs: s.getTime(), rangeEndMs: e.getTime() + DAY_MS,
        columns: cols, title: format(cursor, 'MMMM yyyy'),
        colMinWidth: 36,
      };
    }

    // year
    const yStart = startOfYear(cursor);
    const yEnd = endOfYear(cursor);
    const months = eachMonthOfInterval({ start: yStart, end: yEnd });
    const thisMonthKey = format(new Date(), 'yyyy-MM');
    const cols: CalendarColumn[] = months.map((m, i) => ({
      key: format(m, 'yyyy-MM'),
      startMs: m.getTime(),
      endMs: i < months.length - 1 ? months[i + 1].getTime() : yEnd.getTime() + DAY_MS,
      main: format(m, 'MMM'),
      today: format(m, 'yyyy-MM') === thisMonthKey,
    }));
    return {
      rangeStartMs: yStart.getTime(), rangeEndMs: yEnd.getTime() + DAY_MS,
      columns: cols, title: format(cursor, 'yyyy'),
      colMinWidth: 72,
    };
  }, [mode, cursor]);

  const rangeSpan = rangeEndMs - rangeStartMs;

  function msToPct(ms: number): number {
    return ((ms - rangeStartMs) / rangeSpan) * 100;
  }

  function getBarStyle(project: Project) {
    const startMs = new Date(project.startDate).getTime();
    const endExMs = new Date(project.endDate).getTime() + DAY_MS; // inclusive end date

    const clampedStart = Math.max(startMs, rangeStartMs);
    const clampedEnd = Math.min(endExMs, rangeEndMs);
    if (clampedStart >= clampedEnd) return null;

    const left = msToPct(clampedStart);
    const width = msToPct(clampedEnd) - left;
    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  }

  function navigate(dir: 1 | -1) {
    setCursor((c) => {
      if (mode === 'week') return new Date(c.getTime() + dir * 7 * DAY_MS);
      const n = new Date(c);
      if (mode === 'month') n.setMonth(n.getMonth() + dir);
      else n.setFullYear(n.getFullYear() + dir);
      return n;
    });
  }

  function handleProjectClick(project: Project) {
    openModal(
      `${project.client} — ${project.name}`,
      <ProjectDetailContent project={project} />,
    );
  }

  const now = new Date();
  const todayPct = msToPct(now.getTime());
  const showTodayLine = todayPct >= 0 && todayPct <= 100;
  const colWidthPct = 100 / columns.length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header: navigator + mode switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gold" />
          <span className="font-semibold text-sm text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-all ${
                  mode === m.id
                    ? 'bg-gold text-os-dark'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          No projects to display.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: LABEL_WIDTH + columns.length * colMinWidth }}>
            {/* Column header row */}
            <div className="flex border-b border-border sticky top-0 bg-card z-10">
              <div
                className="flex-shrink-0 border-r border-border px-3 py-2 flex items-center"
                style={{ width: LABEL_WIDTH }}
              >
                <span className="text-xs font-medium text-muted-foreground">Project</span>
              </div>
              <div className="flex flex-1">
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={`flex-shrink-0 flex flex-col items-center justify-center py-1.5 border-r border-border/50 ${
                      col.shaded ? 'bg-muted/30' : ''
                    } ${col.today ? 'bg-gold/10' : ''}`}
                    style={{ width: `${colWidthPct}%`, minWidth: colMinWidth }}
                  >
                    {col.top && (
                      <span className={`text-[10px] leading-none ${
                        col.dimmed ? 'text-muted-foreground/40' : 'text-muted-foreground'
                      }`}>
                        {col.top}
                      </span>
                    )}
                    <span className={`font-medium leading-tight ${col.top ? 'text-xs mt-0.5' : 'text-[11px]'} ${
                      col.today ? 'text-gold font-bold' : col.dimmed ? 'text-muted-foreground/40' : 'text-foreground'
                    }`}>
                      {col.main}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project rows */}
            <div className="relative">
              {projects.map((project) => {
                const bar = getBarStyle(project);
                const sm = STATUS_LABELS[project.status] || STATUS_LABELS.active;
                const barColor = STATUS_BAR_COLORS[project.status] || STATUS_BAR_COLORS.active;

                return (
                  <div
                    key={project.id}
                    className="flex border-b border-border/50 hover:bg-muted/30 transition-colors group"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Label cell */}
                    <div
                      className="flex-shrink-0 border-r border-border px-3 py-2 flex flex-col justify-center cursor-pointer"
                      style={{ width: LABEL_WIDTH }}
                      onClick={() => handleProjectClick(project)}
                      title={`${project.client} — ${project.name} (${sm.label})`}
                    >
                      <span className="text-xs font-medium text-foreground truncate group-hover:text-gold transition-colors">
                        {project.client}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {project.name}
                      </span>
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 relative">
                      {/* Shaded/dimmed/today columns */}
                      {columns.map((col, i) =>
                        col.shaded || col.dimmed || col.today ? (
                          <div
                            key={col.key}
                            className={`absolute top-0 bottom-0 ${col.today ? 'bg-gold/10' : 'bg-muted/20'}`}
                            style={{ left: `${i * colWidthPct}%`, width: `${colWidthPct}%` }}
                          />
                        ) : null,
                      )}

                      {/* Project bar */}
                      {bar && (
                        <div
                          className={`absolute top-2 bottom-2 rounded-md ${barColor} cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-2 overflow-hidden`}
                          style={{ left: bar.left, width: bar.width }}
                          onClick={() => handleProjectClick(project)}
                          title={`${formatDateRange(project)} · ${sm.label}`}
                        >
                          <span className="text-[10px] font-medium text-white truncate drop-shadow-sm">
                            {project.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Today line — spans label offset plus fraction of the remaining width */}
              {showTodayLine && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-20"
                  style={{
                    left: `calc(${todayPct}% + ${((100 - todayPct) / 100) * LABEL_WIDTH}px)`,
                  }}
                >
                  <div className="absolute inset-y-0 -left-px w-px bg-gold" />
                  <div className="absolute top-0 -left-[5px] w-[11px] h-[11px] rounded-full bg-gold" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Active
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> Completed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> On Hold
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gold" /> Today
        </span>
      </div>
    </div>
  );
}

function formatDateRange(project: Project): string {
  const fmt = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return d; }
  };
  return `${fmt(project.startDate)} – ${fmt(project.endDate)}`;
}
