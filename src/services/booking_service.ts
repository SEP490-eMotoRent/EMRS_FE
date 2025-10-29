import { API_BASE_URL } from "../app/dashboard/admin/index";

export async function getBookings() {
  const res = await fetch(`${API_BASE_URL}/bookings`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

export async function getBookingById(id: string) {
  const res = await fetch(`${API_BASE_URL}/bookings/${id}`);
  if (!res.ok) throw new Error("Failed to fetch booking detail");
  return res.json();
}
