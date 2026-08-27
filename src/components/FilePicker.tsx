"use client";

import { useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";

type FilePickerProps = {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  /** Texto do botão — por omissão «Escolher ficheiro» */
  buttonLabel?: string;
  /** Nome do input nativo (quando o ficheiro vai no FormData do formulário) */
  name?: string;
  required?: boolean;
  /** Dica curta sob o botão */
  hint?: string;
  className?: string;
  /** Conteúdo extra (pré-visualização, lista de anexos…) */
  children?: ReactNode;
};

/**
 * Substitui o «Choose File» nativo do browser por um controlo claro em português.
 */
export function FilePicker({
  accept,
  multiple,
  disabled,
  onChange,
  buttonLabel = "Escolher ficheiro",
  name,
  required,
  hint,
  className = "",
  children,
}: FilePickerProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setFileNames(files.map((f) => f.name));
    await onChange(e);
  }

  return (
    <div className={`file-picker ${className}`.trim()}>
      <input
        ref={inputRef}
        id={id}
        className="file-picker__input"
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        required={required}
        disabled={disabled}
        onChange={handleChange}
      />
      <div className="file-picker__row">
        <button
          type="button"
          className="btn-file"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          aria-controls={id}
        >
          <UploadIcon />
          <span>{disabled ? "A carregar…" : buttonLabel}</span>
        </button>
        <p className="file-picker__status" aria-live="polite">
          {fileNames.length === 0
            ? "Nenhum ficheiro seleccionado"
            : fileNames.length === 1
              ? fileNames[0]
              : `${fileNames.length} ficheiros: ${fileNames.join(", ")}`}
        </p>
      </div>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      {children}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
