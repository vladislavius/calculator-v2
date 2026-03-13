'use client';

interface PriceInputProps {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  accentColor?: string;
  width?: number;
  onClick?: (e: React.MouseEvent) => void;
}

export default function PriceInput({
  value,
  onChange,
  unit = '฿',
  accentColor,
  width = 70,
  onClick,
}: PriceInputProps) {
  return (
    <div className="os-price-input-wrap" onClick={onClick || ((e) => e.stopPropagation())}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="os-price-input"
        style={{ width, ...(accentColor ? { borderColor: accentColor, color: accentColor } : {}) }}
      />
      <span className="os-price-input-unit" style={accentColor ? { color: accentColor } : {}}>
        {unit}
      </span>
    </div>
  );
}
