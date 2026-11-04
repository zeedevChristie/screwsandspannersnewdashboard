import { DashboardWidget } from "@/types/dashboard";
import { WidgetThemes } from "@/types/theme";

export default function WidgetCard({
  title,
  value,
  subValue,
  theme,
  icon: Icon,
}: Readonly<DashboardWidget>) {
  const colors = WidgetThemes[theme];

  return (
    <div
      className="
        group
        rounded-2xl
        border
        p-2
        transition-all
        duration-300
        cursor-pointer
        hover:-translate-y-1
        hover:shadow-xl
      "
      style={{
        background: colors.background,
        borderColor: colors.border,
      }}
    >
      <div
        className="
          mb-5
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          transition-transform
          duration-300
          group-hover:scale-110
        "
        style={{
          background: colors.iconBg,
          color: colors.icon,
        }}
      >
        <Icon size={26} strokeWidth={2.2} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {title}
      </p>

      <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
        {value}
      </h2>

      <p className="mt-3 text-sm font-medium text-slate-500">
        {subValue}
      </p>
    </div>
  );
}