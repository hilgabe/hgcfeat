"use client";

export function ConfirmButton({
  children,
  message,
  className,
  style,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
