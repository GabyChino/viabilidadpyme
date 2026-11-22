"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

// Ids de la pista y del error para conectarlos al control (aria-describedby)
function useIdsCampo(idPropio?: string) {
  const generado = useId();
  const id = idPropio ?? generado;
  return { id, idPista: `${id}-pista`, idError: `${id}-error` };
}

function describedBy(hint: string | undefined, error: string | undefined, idPista: string, idError: string) {
  if (error) return idError;
  return hint ? idPista : undefined;
}

function PistaYError({ hint, error, idPista, idError }: { hint?: string; error?: string; idPista: string; idError: string }) {
  return (
    <>
      {hint && !error && <p id={idPista} className="text-xs text-content-3">{hint}</p>}
      {error && (
        <p id={idError} className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={12} aria-hidden="true" /> {error}
        </p>
      )}
    </>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id: idPropio, ...props }: InputProps) {
  const { id, idPista, idError } = useIdsCampo(idPropio);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-content-2">{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy(hint, error, idPista, idError)}
        className={cn(
          "w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all duration-150",
          "placeholder:text-content-3 bg-surface-2 text-content",
          error
            ? "border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            : "border-border focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500",
          className
        )}
        {...props}
      />
      <PistaYError hint={hint} error={error} idPista={idPista} idError={idError} />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder = "Selecciona una opción",
  className,
  id: idPropio,
  ...props
}: SelectProps) {
  const { id, idPista, idError } = useIdsCampo(idPropio);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-content-2">{label}</label>
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy(hint, error, idPista, idError)}
        className={cn(
          "w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all duration-150 bg-surface-2 text-content",
          error
            ? "border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            : "border-border focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500",
          className
        )}
        {...props}
      >
        <option value="" className="bg-surface-2 text-content-3">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-2 text-content">
            {opt.label}
          </option>
        ))}
      </select>
      <PistaYError hint={hint} error={error} idPista={idPista} idError={idError} />
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id: idPropio, ...props }: TextareaProps) {
  const { id, idPista, idError } = useIdsCampo(idPropio);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-content-2">{label}</label>
      <textarea
        id={id}
        rows={4}
        aria-invalid={!!error}
        aria-describedby={describedBy(hint, error, idPista, idError)}
        className={cn(
          // Crece con el texto donde el navegador lo permite; si no, se puede redimensionar
          "w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all duration-150 resize-y field-sizing-content min-h-24 max-h-80",
          "placeholder:text-content-3 bg-surface-2 text-content",
          error
            ? "border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            : "border-border focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500",
          className
        )}
        {...props}
      />
      <PistaYError hint={hint} error={error} idPista={idPista} idError={idError} />
    </div>
  );
}

interface RadioGroupProps {
  label: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string; descripcion?: string }[];
  value: string;
  onChange: (val: string) => void;
}

export function RadioGroup({
  label,
  error,
  hint,
  options,
  value,
  onChange,
}: RadioGroupProps) {
  const { id: nombre, idPista, idError } = useIdsCampo();
  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-invalid={!!error}
      aria-describedby={describedBy(hint, error, idPista, idError)}
    >
      <legend className="text-sm font-medium text-content-2 mb-2">{label}</legend>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-150",
              value === opt.value
                ? "border-brand-500 bg-brand-700/20"
                : "border-border bg-surface-2 hover:border-brand-700 hover:bg-surface-3"
            )}
          >
            <input
              type="radio"
              name={nombre}
              value={opt.value}
              className="mt-0.5 accent-brand-500"
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <div>
              <span className="text-sm font-medium text-content">{opt.label}</span>
              {opt.descripcion && (
                <p className="text-xs text-content-3 mt-0.5">{opt.descripcion}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      <PistaYError hint={hint} error={error} idPista={idPista} idError={idError} />
    </fieldset>
  );
}

interface ToggleProps {
  label: string;
  descripcion?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

export function Toggle({ label, descripcion, checked, onChange }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-2">
      <div>
        <p id={`${id}-etiqueta`} className="text-sm font-medium text-content">{label}</p>
        {descripcion && <p id={`${id}-descripcion`} className="text-xs text-content-3 mt-0.5">{descripcion}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-etiqueta`}
        aria-describedby={descripcion ? `${id}-descripcion` : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex w-11 h-6 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 focus:ring-offset-surface-2",
          checked ? "bg-brand-600" : "bg-surface-3"
        )}
      >
        <span
          className={cn(
            "inline-block w-4 h-4 bg-content rounded-full shadow transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
