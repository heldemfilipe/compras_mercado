"use client";

import { useRef } from "react";

/** Formata centavos -> "1.234,56" (sempre com vírgula e 2 casas). */
function fmt(cents: number): string {
  const [int, dec] = (Math.abs(cents) / 100).toFixed(2).split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withSep},${dec}`;
}

/**
 * Campo de valor em reais no estilo "caixa registradora": começa em `0,00`
 * e os dígitos entram da direita para a esquerda, começando nos centavos
 * (1 -> 0,01 -> 0,10 -> 1,00 -> 12,50). Backspace remove da direita até
 * voltar a `0,00`.
 *
 * Controlado por `value` em reais. Renderiza um input escondido `name`
 * com o número puro (ou "" quando zero) para enviar em formulários.
 */
export default function MoneyInput({
  value,
  onValueChange,
  name,
  onBlur,
  className,
  id,
  ariaLabel,
  inputRef,
}: {
  value: number;
  onValueChange: (reais: number) => void;
  name?: string;
  onBlur?: () => void;
  className?: string;
  id?: string;
  ariaLabel?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? localRef;
  const cents = Math.round((Number(value) || 0) * 100);

  function caretToEnd() {
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        const end = el.value.length;
        el.setSelectionRange(end, end);
      }
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.currentTarget.value.replace(/\D/g, "");
    const next = Math.min(parseInt(digits || "0", 10) || 0, 99_999_999);
    onValueChange(next / 100);
    caretToEnd();
  }

  return (
    <>
      {name && (
        <input
          type="hidden"
          name={name}
          value={cents ? (cents / 100).toString() : ""}
        />
      )}
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="numeric"
        value={fmt(cents)}
        onChange={handleChange}
        onFocus={caretToEnd}
        onClick={caretToEnd}
        onBlur={onBlur}
        aria-label={ariaLabel}
        className={className}
      />
    </>
  );
}
