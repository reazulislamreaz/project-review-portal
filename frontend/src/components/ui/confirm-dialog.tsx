"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonProps["variant"];
  busy?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  busy = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(busy);
  const onCancelRef = useRef(onCancel);
  const titleId = useId();
  const descriptionId = useId();

  busyRef.current = busy;
  onCancelRef.current = onCancel;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    function handleCancel(event: Event) {
      event.preventDefault();
      if (!busyRef.current) {
        onCancelRef.current();
      }
    }

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-surface text-foreground shadow-lg"
      onClick={(event) => {
        if (event.target === dialogRef.current && !busyRef.current) {
          onCancelRef.current();
        }
      }}
    >
      <div
        className="space-y-5 p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p id={descriptionId} className="text-sm leading-relaxed text-subtle">
            {description}
          </p>
        </div>
        {children ? <div className="space-y-2">{children}</div> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
