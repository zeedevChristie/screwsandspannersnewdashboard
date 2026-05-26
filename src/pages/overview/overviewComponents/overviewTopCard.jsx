export default function OverviewTopCard({
  title,
  subtitle,
  action,
  footer,
  children,
  className = "",
}) {
  return (
    <div
      className={`
        bg-white 
        rounded-2xl 
        border border-gray-100 
        shadow-sm 
        p-4 sm:p-6 
        w-full 
        transition-all 
        duration-300 
        hover:shadow-md
        ${className}
      `}
    >
      {/* ===== Header ===== */}
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            {title && (
              <h2 className="text-lg font-semibold text-gray-800">
                {title}
              </h2>
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

      {/* ===== Content ===== */}
      <div>{children}</div>

      {/* ===== Optional Footer ===== */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
}