import ChevronDownIcon from "../../../../icons/ChevronDownIcon";
import { COMPACT_INPUT_CLASS, LABEL_CHIP_CLASS } from "./filterPrimitives";

export type FilterSelectOption = { value: string; label: string };

type FilterSelectProps = {
  id: string;
  label: string;
  "aria-label"?: string;
  value: string;
  options: readonly FilterSelectOption[];
  onChange: (value: string) => void;
  /** Tailwind width utility, e.g. `w-[5.75rem]` */
  selectWidthClass?: string;
};

export default function FilterSelect({
  id,
  label,
  "aria-label": ariaLabel,
  value,
  options,
  onChange,
  selectWidthClass = "w-[5.75rem]",
}: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className={LABEL_CHIP_CLASS}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${COMPACT_INPUT_CLASS} ${selectWidthClass} shrink-0 cursor-pointer appearance-none pr-9`}
        >
          {options.map((opt) => (
            <option key={opt.value || "__empty"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 size-[1.0625rem] -translate-y-1/2 text-[var(--muted)]"
        />
      </div>
    </div>
  );
}
