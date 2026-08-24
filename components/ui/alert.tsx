type AlertTone = "info" | "success" | "warning" | "danger";

type AlertProps = {
  children: React.ReactNode;
  className?: string;
  tone?: AlertTone;
};

const toneClassName: Record<AlertTone, string> = {
  danger: "alert-danger",
  info: "alert-info",
  success: "alert-success",
  warning: "alert-warning",
};

export function Alert({ children, className = "", tone = "info" }: AlertProps) {
  return (
    <div
      className={`app-alert ${toneClassName[tone]} ${className}`}
      role={tone === "danger" ? "alert" : "status"}
      aria-live={tone === "danger" ? "assertive" : "polite"}
    >
      {children}
    </div>
  );
}
