"use client";

import { useRef } from "react";

/** Formata centavos -> "1.234,56" (sempre com vírgula e 2 casas). */
function fmt(cents: number): string {
  const [int, dec] = (Math.abs(cents) / 100).toFixed(2).split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withSep},${dec}`;
}

/**
 * Campo de valor em reais no estilo "caixa registradora":
 * fica EM BRANCO quando não há valor (placeholder mostra `0,00` só como
 * dica). Ao digitar, os dígitos entram da direita para a esquerda,
 * começando nos centavos (1 -> 0,01 -> 0,12 -> 1,25). Backspace remove
 * da direita; ao chegar em zero volta a ficar em branco.
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
  placeholder = "0,00",
}: {
  value: number;
  onValueChange: (reais: number) => void;
  name?: string;
  onBlur?: () => void;
  className?: string;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const cents = Math.round((Number(value) || 0) * 100);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.currentTarget.value.replace(/\D/g, "");
    const next = Math.min(parseInt(digits || "0", 10) || 0, 99_999_999);
    onValueChange(next / 100);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        const end = el.value.length;
        el.setSelectionRange(end, end);
      }
    });
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
        value={cents > 0 ? fmt(cents) : ""}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={className}
      />
    </>
  );
}
