import clsx from "clsx";

export default function RevenueAndAgentsCard({
  title,
  subtitle,
  action,
  footer,
  children,
  className,
  noPadding = false,
}) {
  return (
    <div
      className={clsx(
        "bg-white",
        "rounded-2xl",
        "border border-gray-200",
        "shadow-sm",
        "transition-all duration-300",
        "hover:shadow-md",
        className
      )}
    >
      {/* ===== Header ===== */}
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between px-5 pt-5">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-800">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500">
                {subtitle}
              </p>
            )}
          </div>

          {action && (
            <div className="flex items-center">
              {action}
            </div>
          )}
        </div>
      )}

      {/* ===== Body ===== */}
      <div
        className={clsx(
          "px-5 pb-5 pt-4",
          noPadding && "p-0"
        )}
      >
        {children}
      </div>

      {/* ===== Footer ===== */}
      {footer && (
        <div className="border-t border-gray-100 px-5 py-4">
          {footer}
        </div>
      )}
    </div>
  );
}