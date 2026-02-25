"use client";

import { useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import { CreatePollRequest } from "@/types/feed";

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

const DAYS_OPTIONS = Array.from({ length: 8 }, (_, i) => i);
const HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_OPTIONS = [0, 15, 30, 45];

interface PollCreatorProps {
  onChange: (poll: CreatePollRequest) => void;
  onRemove: () => void;
}

export function PollCreator({ onChange, onRemove }: PollCreatorProps) {
  const [options, setOptions] = useState(["", ""]);
  const [days, setDays] = useState(1);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const notify = (opts: string[], d: number, h: number, m: number) => {
    onChange({ options: opts, duration_hours: d * 24 + h + m / 60 });
  };

  const handleOptionChange = (index: number, value: string) => {
    const next = options.map((o, i) => (i === index ? value : o));
    setOptions(next);
    notify(next, days, hours, minutes);
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    const next = [...options, ""];
    setOptions(next);
    notify(next, days, hours, minutes);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    const next = options.filter((_, i) => i !== index);
    setOptions(next);
    notify(next, days, hours, minutes);
  };

  const handleDays = (d: number) => { setDays(d); notify(options, d, hours, minutes); };
  const handleHours = (h: number) => { setHours(h); notify(options, days, h, minutes); };
  const handleMinutes = (m: number) => { setMinutes(m); notify(options, days, hours, m); };

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-gray-200 overflow-hidden">
      {/* Options */}
      <div className="divide-y divide-gray-100">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2.5">
            <input
              type="text"
              placeholder={`Choice ${i + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              maxLength={80}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            {options.length > MIN_OPTIONS && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
            {i === options.length - 1 && options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={addOption}
                className="shrink-0 text-lg font-bold leading-none text-[#27CEC5] hover:text-[#20b5ad]"
              >
                +
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Duration */}
      <div className="border-t border-gray-200 px-3 py-3">
        <p className="mb-2 text-sm font-semibold text-gray-900">Poll length</p>
        <div className="flex gap-2">
          <DurationSelect label="Days" value={days} options={DAYS_OPTIONS} onChange={handleDays} />
          <DurationSelect label="Hours" value={hours} options={HOURS_OPTIONS} onChange={handleHours} />
          <DurationSelect label="Minutes" value={minutes} options={MINUTES_OPTIONS} onChange={handleMinutes} />
        </div>
      </div>

      {/* Remove */}
      <div className="border-t border-gray-100 px-3 py-2.5 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-medium text-red-500 hover:text-red-600"
        >
          Remove poll
        </button>
      </div>
    </div>
  );
}

function DurationSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5">
      <p className="text-xs text-gray-400">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
