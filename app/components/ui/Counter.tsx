'use client';

interface CounterProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  label?: string;
}

export default function Counter({ value, onChange, min = 0, label }: CounterProps) {
  return (
    <div className="os-counter">
      <button className="os-counter__btn" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="os-counter__val">{value}</span>
      <button className="os-counter__btn" onClick={() => onChange(value + 1)}>+</button>
      {label && <span style={{ fontSize: 11, color: 'var(--os-text-3)', marginLeft: 2 }}>{label}</span>}
    </div>
  );
}
