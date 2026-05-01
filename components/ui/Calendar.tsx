'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRange {
  from?: Date;
  to?: Date;
}

type SelectionMode = 'single' | 'range';

interface CalendarBaseProps {
  className?: string;
  numberOfMonths?: number;
}

interface SingleCalendarProps extends CalendarBaseProps {
  mode: 'single';
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
}

interface RangeCalendarProps extends CalendarBaseProps {
  mode: 'range';
  selected?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
}

type CalendarProps = SingleCalendarProps | RangeCalendarProps;

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, from: Date, to: Date) {
  return date >= from && date <= to;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface MonthViewProps {
  year: number;
  month: number;
  mode: SelectionMode;
  selected?: Date | DateRange;
  hoverDate?: Date;
  onDayClick: (date: Date) => void;
  onDayHover: (date: Date) => void;
}

function MonthView({ year, month, mode, selected, hoverDate, onDayClick, onDayHover }: MonthViewProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const getSelectedFrom = (): Date | undefined => {
    if (mode === 'single') return selected as Date | undefined;
    return (selected as DateRange)?.from;
  };

  const getSelectedTo = (): Date | undefined => {
    if (mode === 'single') return undefined;
    return (selected as DateRange)?.to;
  };

  const from = getSelectedFrom();
  const to = getSelectedTo();

  const isDaySelected = (date: Date) => {
    if (mode === 'single') return from ? isSameDay(date, from) : false;
    return (from && isSameDay(date, from)) || (to && isSameDay(date, to)) || false;
  };

  const isDayInRange = (date: Date) => {
    if (mode !== 'range') return false;
    if (from && to) return isInRange(date, from, to);
    if (from && hoverDate && !to) {
      const rangeStart = startOfDay(from) <= startOfDay(hoverDate) ? from : hoverDate;
      const rangeEnd = startOfDay(from) <= startOfDay(hoverDate) ? hoverDate : from;
      return isInRange(date, rangeStart, rangeEnd);
    }
    return false;
  };

  const today = new Date();

  return (
    <div className="p-3">
      <div className="text-sm font-semibold text-center mb-2">
        {MONTHS[month]} {year}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1 w-9">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="w-9 h-9" />;
          }

          const selected_ = isDaySelected(date);
          const inRange = isDayInRange(date);
          const isToday = isSameDay(date, today);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onDayHover(date)}
              className={`
                w-9 h-9 text-sm rounded-full flex items-center justify-center transition-colors
                ${selected_
                  ? 'bg-purple-600 text-white font-semibold hover:bg-purple-700'
                  : inRange
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-none'
                  : isToday
                  ? 'border border-purple-400 text-purple-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                }
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Calendar(props: CalendarProps) {
  const { mode, className = '', numberOfMonths = 1 } = props;
  const [hoverDate, setHoverDate] = React.useState<Date | undefined>(undefined);

  const today = new Date();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (date: Date) => {
    if (mode === 'single') {
      (props as SingleCalendarProps).onSelect?.(date);
    } else {
      const rangeProps = props as RangeCalendarProps;
      const current = rangeProps.selected;
      if (!current?.from || (current.from && current.to)) {
        // Start new range
        rangeProps.onSelect?.({ from: date, to: undefined });
      } else {
        // Complete the range
        const from = current.from;
        if (startOfDay(date) < startOfDay(from)) {
          rangeProps.onSelect?.({ from: date, to: from });
        } else {
          rangeProps.onSelect?.({ from, to: date });
        }
      }
    }
  };

  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < numberOfMonths; i++) {
    const m = (viewMonth + i) % 12;
    const y = viewYear + Math.floor((viewMonth + i) / 12);
    months.push({ year: y, month: m });
  }

  return (
    <div className={`inline-block select-none ${className}`}>
      <div className="flex items-center justify-between px-3 pt-3">
        <button
          type="button"
          onClick={goToPrev}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={goToNext}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex">
        {months.map(({ year, month }) => (
          <MonthView
            key={`${year}-${month}`}
            year={year}
            month={month}
            mode={mode}
            selected={mode === 'single' ? (props as SingleCalendarProps).selected : (props as RangeCalendarProps).selected}
            hoverDate={hoverDate}
            onDayClick={handleDayClick}
            onDayHover={setHoverDate}
          />
        ))}
      </div>
    </div>
  );
}
