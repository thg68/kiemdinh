type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

export function Card({ children, className = "", padded = false, ...props }: CardProps) {
  return (
    <div className={`surface-card ${padded ? "surface-card-pad" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}
