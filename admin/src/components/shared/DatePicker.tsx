"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  className?: string;
  date: string | undefined;
  setDate: (date: string) => void;
  container?: HTMLDivElement;
  disablePast?: boolean;  // optional — pass true only where you need it
};

export function DatePicker({ className, date, setDate, container, disablePast = false }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full h-12 justify-between text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          {date ? format(parseISO(date), "PPP") : <span>Pick a date</span>}
          <CalendarIcon className="ml-2 size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent portalContainer={container} className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date ? parseISO(date) : undefined}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              setDate(format(selectedDate, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          disabled={disablePast ? { before: new Date() } : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}