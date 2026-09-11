import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: LayoutProps<"/quan-tri">) {
  return <AdminShell>{children}</AdminShell>;
}
