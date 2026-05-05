"use client";

import { useTransition } from "react";
import { FiTrash2 } from "react-icons/fi";

type Props = {
  action: () => Promise<void>;
  message?: string;
  label?: string;
  className?: string;
  /** Si false, no muestra el icono de papelera. Default: true. */
  withIcon?: boolean;
};

export default function DeleteButton({
  action,
  message = "¿Eliminar este registro? Esta acción no se puede deshacer.",
  label = "Eliminar",
  className = "btn-danger",
  withIcon = true,
}: Props) {
  const [isPending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      className={className}
      onClick={() => {
        if (confirm(message)) start(() => action());
      }}
    >
      {isPending ? (
        "..."
      ) : (
        <span className="inline-flex items-center justify-center gap-1.5">
          {withIcon && <FiTrash2 className="h-[18px] w-[18px]" aria-hidden="true" />}
          <span>{label}</span>
        </span>
      )}
    </button>
  );
}
