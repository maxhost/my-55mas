'use client';

type Props = {
  id: string;
  value: boolean;
  onChange: (v: boolean) => void;
  yesLabel: string;
  noLabel: string;
};

export function BooleanInputRenderer({ id, value, onChange, yesLabel, noLabel }: Props) {
  return (
    <div className="flex gap-4" role="radiogroup">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="radio"
          name={id}
          checked={value === true}
          onChange={() => onChange(true)}
          className="h-4 w-4"
        />
        {yesLabel}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="radio"
          name={id}
          checked={value === false}
          onChange={() => onChange(false)}
          className="h-4 w-4"
        />
        {noLabel}
      </label>
    </div>
  );
}
