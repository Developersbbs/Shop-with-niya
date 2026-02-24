"use client";

import { useState } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type TimePickerProps = {
  className?: string;
  time: string | undefined;
  setTime: (time: string) => void;
  disabled?: boolean;
};

export function TimePicker({
  className,
  time,
  setTime,
  disabled = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Convert 24-hour time string to 12-hour format for display
  const convertTo12Hour = (time24: string) => {
    if (!time24) return { hours: "12", minutes: "00", isAm: true };
    
    const [hours, minutes] = time24.split(":");
    const hour24 = parseInt(hours);
    
    let hour12 = hour24;
    let am = true;
    
    if (hour24 === 0) {
      hour12 = 12;
      am = true;
    } else if (hour24 < 12) {
      hour12 = hour24;
      am = true;
    } else if (hour24 === 12) {
      hour12 = 12;
      am = false;
    } else {
      hour12 = hour24 - 12;
      am = false;
    }
    
    return {
      hours: hour12.toString().padStart(2, "0"),
      minutes: minutes || "00",
      isAm: am
    };
  };

  // Convert 12-hour format to 24-hour time string
  const convertTo24Hour = (hours12: string, minutes: string, am: boolean) => {
    let hour24 = parseInt(hours12);
    
    if (!am && hour24 < 12) {
      hour24 += 12;
    } else if (am && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, "0")}:${minutes || "00"}`;
  };

  // Get current 12-hour display values
  const displayTime = time ? convertTo12Hour(time) : { hours: "12", minutes: "00", isAm: true };

  // Generate hour and minute options
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

  // Handle hour increment/decrement
  const handleHourChange = (direction: 'up' | 'down') => {
    const currentHour = parseInt(displayTime.hours);
    let newHour;
    
    if (direction === 'up') {
      newHour = currentHour === 12 ? 1 : currentHour + 1;
    } else {
      newHour = currentHour === 1 ? 12 : currentHour - 1;
    }
    
    const time24 = convertTo24Hour(newHour.toString().padStart(2, "0"), displayTime.minutes, displayTime.isAm);
    setTime(time24);
  };

  // Handle minute increment/decrement
  const handleMinuteChange = (direction: 'up' | 'down') => {
    const currentMinute = parseInt(displayTime.minutes);
    let newMinute;
    
    if (direction === 'up') {
      newMinute = currentMinute === 55 ? 0 : currentMinute + 5;
    } else {
      newMinute = currentMinute === 0 ? 55 : currentMinute - 5;
    }
    
    const time24 = convertTo24Hour(displayTime.hours, newMinute.toString().padStart(2, "0"), displayTime.isAm);
    setTime(time24);
  };

  // Handle AM/PM toggle
  const handleAmPmToggle = (am: boolean) => {
    const time24 = convertTo24Hour(displayTime.hours, displayTime.minutes, am);
    setTime(time24);
  };

  return (
    <div className="flex gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-12",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            disabled={disabled}
          >
            <Clock className="mr-2 h-4 w-4" />
            {displayTime.hours}:{displayTime.minutes} {displayTime.isAm ? 'AM' : 'PM'}
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="text-center font-medium">Select Time</div>
            
            {/* Time Picker Interface */}
            <div className="flex items-center justify-center gap-4">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleHourChange('up')}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="h-12 w-16 flex items-center justify-center border rounded bg-muted font-mono text-lg">
                  {displayTime.hours}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleHourChange('down')}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-2xl font-bold">:</div>
              
              {/* Minutes */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleMinuteChange('up')}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="h-12 w-16 flex items-center justify-center border rounded bg-muted font-mono text-lg">
                  {displayTime.minutes}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleMinuteChange('down')}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              
              {/* AM/PM */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant={displayTime.isAm ? "default" : "outline"}
                  size="sm"
                  className="w-12 h-8"
                  onClick={() => handleAmPmToggle(true)}
                >
                  AM
                </Button>
                <Button
                  variant={!displayTime.isAm ? "default" : "outline"}
                  size="sm"
                  className="w-12 h-8"
                  onClick={() => handleAmPmToggle(false)}
                >
                  PM
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
