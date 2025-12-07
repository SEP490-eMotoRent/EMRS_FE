"use client";

import { use } from "react";
import VehicleTrackingScreen from "@/app/dashboard/components/VehicleTrackingScreen";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ManagerVehicleTrackingPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <VehicleTrackingScreen
      vehicleId={id}
      backHref="/dashboard/manager/fleet"
      backLabel="← Quay lại quản lý Fleet"
    />
  );
}

