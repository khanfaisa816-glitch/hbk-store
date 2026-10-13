import { useState } from 'react';
import { StarIcon } from './Icons';

// Read-only rating. The yellow stars are cut to the right width (4.3 stars = 86%).
export function Stars({ value = 0, count, size = 14 }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const label = count > 0 ? `Rated ${value.toFixed(1)} out of 5 from ${count} reviews` : 'No reviews yet';
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={label} role="img">
      <span className="relative inline-block leading-none tracking-[1px]" style={{ fontSize: size }} aria-hidden="true">
        <span className="text-ink/15">★★★★★</span>
        <span className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-amber-500" style={{ width: `${pct}%` }}>
          ★★★★★
        </span>
      </span>
      {count != null && (
        <span className="text-xs text-ink-soft" aria-hidden="true">
          {count > 0 ? `${value.toFixed(1)} (${count})` : 'No reviews yet'}
        </span>
      )}
    </span>
  );
}

// Clickable 1-5 star picker for the review form
export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className={`rounded p-0.5 ${n <= shown ? 'text-amber-500' : 'text-ink/20'}`}
        >
          <StarIcon size={28} filled={n <= shown} />
        </button>
      ))}
    </div>
  );
}
