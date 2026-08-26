'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays,
  format, isSameDay, addMonths, subMonths, isToday, isWeekend,
  startOfWeek, endOfWeek, isBefore, isAfter,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useAppStore, formatPrice } from '@/lib/store';
import { ProjectDetailContent } from '@/components/shared/project-detail-content';
import { StatusBadge } from '@/components/shared/status-badge';
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

const ROW_HEIGHT = 40;
const LABEL_WIDTH = 180;

interface ProjectCalendarProps {
  projects: Project[];
}

export function ProjectCalendar({ projects }: ProjectCalendarProps) {
  const openModal = useAppStore((s) => s.openModal);
  const currency = useAppStore((s) => s.currency);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart.getTime(), calendarEnd.getTime()],
  );

  const totalDays = days.length;

  const today = new Date();
  const todayOffset = useMemo(() => {
    if (isBefore(today, calendarStart) || isAfter(today, calendarEnd)) return -1;
    return differenceInDays(today, calendarStart);
  }, [calendarStart.getTime(), calendarEnd.getTime(), today]);

  function getBarStyle(project: Project) {
    const pStart = new Date(project.startDate);
    const pEnd = new Date(project.endDate);

    const effectiveStart = isBefore(pStart, calendarStart) ? calendarStart : pStart;
    const effectiveEnd = isAfter(pEnd, calendarEnd) ? calendarEnd : pEnd;

    if (isAfter(effectiveStart, effectiveEnd)) return null;

    const startOffset = differenceInDays(effectiveStart, calendarStart);
    const span = differenceInDays(effectiveEnd, effectiveStart) + 1;

    const leftPct = (startOffset / totalDays) * 100;
    const widthPct = (span / totalDays) * 100;

    return { left: `${leftPct}%`, width: `${widthPct}%` };
  }

  function handleProjectClick(project: Project) {
    openModal(
      `${project.client} — ${project.name}`,
      <ProjectDetailContent project={project} />,
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header: month navigator */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gold" />
          <span className="font-semibold text-sm text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
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
          <div style={{ minWidth: LABEL_WIDTH + totalDays * 36 }}>
            {/* Day header row */}
            <div className="flex border-b border-border sticky top-0 bg-card z-10">
              <div
                className="flex-shrink-0 border-r border-border px-3 py-2 flex items-center"
                style={{ width: LABEL_WIDTH }}
              >
                <span className="text-xs font-medium text-muted-foreground">Project</span>
              </div>
              <div className="flex flex-1">
                {days.map((day, i) => {
                  const dayNum = day.getDate();
                  const weekend = isWeekend(day);
                  const inMonth = day.getMonth() === currentMonth.getMonth();
                  const todayCol = isToday(day);
                  return (
                    <div
                      key={i}
                      className={`flex-shrink-0 flex flex-col items-center justify-center py-1.5 border-r border-border/50 ${
                        weekend ? 'bg-muted/30' : ''
                      } ${todayCol ? 'bg-gold/10' : ''}`}
                      style={{ width: totalDays > 0 ? `${100 / totalDays}%` : 36, minWidth: 36 }}
                    >
                      <span className={`text-[10px] leading-none ${
                        inMonth ? 'text-muted-foreground' : 'text-muted-foreground/40'
                      }`}>
                        {format(day, 'EEE')}
                      </span>
                      <span className={`text-xs font-medium leading-tight mt-0.5 ${
                        todayCol ? 'text-gold font-bold' : inMonth ? 'text-foreground' : 'text-muted-foreground/40'
                      }`}>
                        {dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Project rows */}
            <div className="relative">
              {/* Today line */}
              {todayOffset >= 0 && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-gold z-20 pointer-events-none"
                  style={{ left: LABEL_WIDTH + (todayOffset + 0.5) * (100 / totalDays) + '%' }}
                >
                  <div className="absolute -top-0 -left-1.5 w-3 h-3 rounded-full bg-gold" />
                </div>
              )}

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
                      {/* Weekend shading */}
                      {days.map((day, i) => {
                        if (!isWeekend(day)) return null;
                        const leftPct = (i / totalDays) * 100;
                        return (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 bg-muted/20"
                            style={{ left: `${leftPct}%`, width: `${100 / totalDays}%` }}
                          />
                        );
                      })}

                      {/* Project bar */}
                      {bar && (
                        <div
                          className={`absolute top-2 bottom-2 rounded-md ${barColor} cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-2 overflow-hidden`}
                          style={{ left: bar.left, width: bar.width }}
                          onClick={() => handleProjectClick(project)}
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
