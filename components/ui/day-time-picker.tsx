"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DayTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DayTimePicker({ value, onChange, className }: DayTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const timeScrollRef = useRef<HTMLDivElement>(null);

  // Generate the last 14 days for selection
  const generateDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }
    
    return days;
  };

  // Generate time slots in 30-minute intervals
  const generateTimeSlots = React.useCallback(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = formatTime(hour, minute);
        slots.push({ hour, minute, display: timeString, value: `${hour}:${minute.toString().padStart(2, '0')}` });
      }
    }
    return slots;
  }, []);

  // Format time to 12-hour format with AM/PM
  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  // Format day display text
  const formatDayDisplay = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Check if a date is the selected date
  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  // Initialize selected time from value prop
  useEffect(() => {
    if (value) {
      const hours = value.getHours();
      const minutes = Math.floor(value.getMinutes() / 30) * 30; // Round to nearest 30min
      setSelectedTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
      setSelectedDate(new Date(value));
    } else {
      // Default to current time rounded to nearest 30min
      const now = new Date();
      const hours = now.getHours();
      const minutes = Math.floor(now.getMinutes() / 30) * 30;
      setSelectedTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
    }
  }, [value]);

  // Handle day selection
  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
    updateDateTime(date, selectedTime);
  };

  // Handle time selection
  const handleTimeSelect = (timeValue: string) => {
    setSelectedTime(timeValue);
    updateDateTime(selectedDate, timeValue);
  };

  // Update the combined date-time and call onChange
  const updateDateTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDateTime = new Date(date);
    newDateTime.setHours(hours, minutes, 0, 0);
    onChange(newDateTime);
  };

  // Scroll to selected time on mount
  useEffect(() => {
    const timeSlots = generateTimeSlots();
    if (timeScrollRef.current && selectedTime) {
      const timeIndex = timeSlots.findIndex(slot => slot.value === selectedTime);
      if (timeIndex >= 0) {
        const scrollTop = timeIndex * 48; // 48px per item
        timeScrollRef.current.scrollTop = scrollTop;
      }
    }
  }, [selectedTime, generateTimeSlots]);

  const days = generateDays();
  const timeSlots = generateTimeSlots();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Day Picker */}
      <div>
        <h3 className="text-sm font-medium mb-2">Select Date</h3>
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {days.map((day, dayIndex) => (
              <Button
                key={dayIndex}
                type="button"
                variant={isSameDate(day, selectedDate) ? "default" : "outline"}
                size="sm"
                onClick={() => handleDaySelect(day)}
                className="whitespace-nowrap min-w-[80px] h-11"
              >
                {formatDayDisplay(day)}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Time Picker */}
      <div>
        <h3 className="text-sm font-medium mb-2">Select Time</h3>
        <ScrollArea 
          className="h-48 border rounded-md"
          ref={timeScrollRef}
        >
          <div className="p-1">
            {timeSlots.map((slot) => (
              <Button
                key={slot.value}
                type="button"
                variant={selectedTime === slot.value ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTimeSelect(slot.value)}
                className={cn(
                  "w-full justify-center h-12 mb-1 text-sm",
                  selectedTime === slot.value && "font-medium"
                )}
              >
                {slot.display}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}