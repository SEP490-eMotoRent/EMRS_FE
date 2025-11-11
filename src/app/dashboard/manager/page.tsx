"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ManagerPage() {
  const router = useRouter();

  useEffect(() => {
    // ✅ Khi vào /dashboard/manager thì tự redirect sang dashboard
    router.replace("/dashboard/manager/dashboard");
  }, [router]);

  return null;
}
