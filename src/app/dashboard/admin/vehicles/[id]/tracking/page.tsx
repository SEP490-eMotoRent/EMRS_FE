"use client";

import { use } from "react";
import VehicleTrackingScreen from "@/app/dashboard/components/VehicleTrackingScreen";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminVehicleTrackingPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <VehicleTrackingScreen
      vehicleId={id}
      backHref="/dashboard/admin/vehicles"
      backLabel="← Quay lại danh sách xe"
    />
  );
}

