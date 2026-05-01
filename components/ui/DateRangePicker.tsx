'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from './Button';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Calendar as CalendarComponent } from './Calendar';
import { format } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          {value.from ? format(value.from, 'LLL dd, y') : 'Start date'} -{' '}
          {value.to ? format(value.to, 'LLL dd, y') : 'End date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="range"
          selected={{ from: value.from, to: value.to }}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              onChange({ from: range.from, to: range.to });
            }
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}