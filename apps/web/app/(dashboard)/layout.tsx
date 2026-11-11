import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <aside className="flex w-56 flex-col justify-between border-r border-gray-200 p-4">
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="rounded px-2 py-1.5 hover:bg-gray-100">
            Kanban
          </Link>
          <Link href="/analytics" className="rounded px-2 py-1.5 hover:bg-gray-100">
            Analytics
          </Link>
          <Link href="/settings" className="rounded px-2 py-1.5 hover:bg-gray-100">
            Settings
          </Link>
        </nav>
        <UserButton />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
