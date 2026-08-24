import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "warning";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  variant?: ButtonVariant;
};

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  className?: string;
  variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: "button-primary",
  secondary: "button-secondary",
  warning: "button-secondary button-warning",
};

export function Button({
  children,
  className = "",
  disabled,
  isLoading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${variantClassName[variant]} ${className}`}
      disabled={disabled || isLoading}
      type={type}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={`${variantClassName[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
