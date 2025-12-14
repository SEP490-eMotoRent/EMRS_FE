"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TechnicianRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/technician/repair-requests");
  }, [router]);

  return null;
}

