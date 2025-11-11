"use client";
import React, { useEffect, useState } from "react";
import {
  getBranchClaims,
  getClaimById,
  updateClaim,
  settleClaim,
  InsuranceClaim,
} from "./insurance_service";
import {
  ClaimTable,
  ClaimDetailModal,
  ClaimUpdateForm,
  ClaimSettlementModal,
} from "@/app/components/claims";
import { message } from "antd";

export default function ManagerInsurancePage() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [selected, setSelected] = useState<InsuranceClaim | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openSettlement, setOpenSettlement] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await getBranchClaims();
      setClaims(data);
    } catch (err: any) {
      message.error(err.message || "Không thể tải danh sách sự cố");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleView = async (id: string) => {
    try {
      const detail = await getClaimById(id);
      setSelected(detail);
      setOpenDetail(true);
    } catch (err: any) {
      message.error(err.message || "Không thể tải chi tiết claim");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateClaim(id, { id, Status: "Processing" });
      message.success("Đã duyệt hồ sơ, chuyển sang xử lý!");
      setOpenDetail(false);
      fetchClaims();
    } catch {
      message.error("Không thể duyệt hồ sơ!");
    }
  };

  const handleEdit = (claim: InsuranceClaim) => {
    setSelected(claim);
    setOpenDetail(false);
    setOpenUpdate(true);
  };

  const handleOpenSettlement = (id: string) => {
    setSelected((prev) => (prev && prev.id === id ? prev : { ...prev, id } as any));
    setOpenDetail(false);
    setOpenSettlement(true);
  };

const handleUpdate = async (data: any) => {
  if (!selected) return;
  try {
    const result = await updateClaim(selected.id, data);
    if (result.success) message.success("Cập nhật hồ sơ thành công!");
    else message.warning(result.message || "Không thể cập nhật hồ sơ!");
    setOpenUpdate(false);
    fetchClaims();
  } catch (err: any) {
    console.error("❌ Lỗi:", err);
    message.error("Cập nhật thất bại!");
  }
};


  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">
        Sự cố & Bảo hiểm chi nhánh
      </h2>

      <ClaimTable data={claims} onView={handleView} />

      <ClaimDetailModal
        open={openDetail}
        data={selected}
        onClose={() => setOpenDetail(false)}
        onApprove={handleApprove}
        onSettlement={handleOpenSettlement}
        onEdit={handleEdit}
      />

      <ClaimUpdateForm
        open={openUpdate}
        onClose={() => setOpenUpdate(false)}
        onSubmit={handleUpdate}
        data={selected}
      />

    <ClaimSettlementModal
  open={openSettlement}
  id={selected?.id ?? null}
  onClose={() => setOpenSettlement(false)}
  onSuccess={fetchClaims}
/>
    </div>
  );
}
