import { Search } from "lucide-react";
import { AnimalTheme } from "@/types/animal";
import NotificationBell from "@/components/notificationBell";

interface NavbarProps {
  animal: AnimalTheme;
}

export default function NavBar({ animal }: Readonly<NavbarProps>) {
  const Icon = animal.icon;

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b bg-white">

      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: animal.secondary,
            color: animal.primary,
          }}
        >
          <Icon size={22} strokeWidth={2.2} />
        </div>

        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: animal.primary }}
          >
            {animal.eyeName} - (Dashboard)
          </h2>

          <p className="text-xs text-gray-500">
            {animal.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search..."
            className="
              w-64
              rounded-xl
              border
              bg-gray-50
              py-2
              pl-10
              pr-4
              text-sm
              transition
              focus:border-transparent
              focus:bg-white
              focus:outline-none
              focus:ring-2
            "
            style={
              {
                "--tw-ring-color": animal.primary,
              } as React.CSSProperties
            }
          />
        </div>

        <NotificationBell color={animal.primary} />
      </div>
    </header>
  );
}