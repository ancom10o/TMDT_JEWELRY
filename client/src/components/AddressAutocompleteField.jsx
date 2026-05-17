/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AddressAutocompleteField({
  label,
  name,
  value,
  placeholder,
  error,
  options,
  onInputChange,
  onSelect,
  disabled = false,
  helperText = '',
  loadingText = '',
  emptyText = ''
}) {
  const [isOpen, setIsOpen] = useState(false);

  const visibleOptions = useMemo(() => options.slice(0, 8), [options]);

  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="relative">
        <input
          name={name}
          value={value}
          onChange={(event) => {
            onInputChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            globalThis.setTimeout(() => {
              setIsOpen(false);
            }, 120);
          }}
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder}
          className="input-field pr-10"
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
          <ChevronDownIcon />
        </span>

        {isOpen && !disabled && (visibleOptions.length > 0 || helperText || loadingText) ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
            {loadingText ? <p className="px-4 py-3 text-sm text-slate-500">{loadingText}</p> : null}

            {!loadingText && visibleOptions.length > 0 ? (
              <div className="max-h-64 overflow-y-auto py-2">
                {visibleOptions.map((option) => (
                  <button
                    key={option.code || option.name}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                      onSelect(option);
                      setIsOpen(false);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-[#f4f7fb] hover:text-navy"
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            ) : null}

            {!loadingText && visibleOptions.length === 0 && (emptyText || helperText) ? (
              <p className="px-4 py-3 text-sm text-slate-500">{emptyText || helperText}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      {error ? <span className="helper-error">{error}</span> : null}
    </label>
  );
}

export default AddressAutocompleteField;
