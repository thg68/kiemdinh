type AlertTone = "info" | "success" | "warning" | "danger";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: AlertTone;
};

const toneClassName: Record<AlertTone, string> = {
  danger: "alert-danger",
  info: "alert-info",
  success: "alert-success",
  warning: "alert-warning",
};

export function Alert({
  children,
  className = "",
  tone = "info",
  ...props
}: AlertProps) {
  return (
    <div
      className={`app-alert ${toneClassName[tone]} ${className}`}
      role={tone === "danger" ? "alert" : "status"}
      aria-live={tone === "danger" ? "assertive" : "polite"}
      {...props}
    >
      {children}
    </div>
  );
}
