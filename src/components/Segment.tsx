"use client";

// Two-or-more option toggle.
export function Segment<T extends string>(props: {
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <div className="seg">
      {props.options.map(([value, label]) => (
        <button key={value} data-on={value === props.value} onClick={() => props.onChange(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}
