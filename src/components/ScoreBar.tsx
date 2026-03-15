interface ScoreBarProps {
  value: number;
  max: number;
  color?: string;
}

export function ScoreBar({ value, max, color = "bg-blue-500" }: ScoreBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div
        className={`${color} h-1.5 rounded-full`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
