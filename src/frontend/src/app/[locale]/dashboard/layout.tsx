import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/api/auth/signin?callbackUrl=/${locale}/dashboard`);
  }

  return <>{children}</>;
}
