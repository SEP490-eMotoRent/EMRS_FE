"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  message,
  Select,
} from "antd";

interface TransferRequest {
  id: string;
  requestId?: string;
  status?: string;
  vehicleModelId?: string;
  vehicleModelName?: string;
  quantityRequested?: number;
  description?: string;
  createdAt?: string;
}

interface VehicleModelOption {
  vehicleModelId: string;
  modelName: string;
}

export default function ManagerTransfersPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TransferRequest[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [models, setModels] = useState<VehicleModelOption[]>([]);

  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vehicle-transfer-request/branch", {
        cache: "no-store",
      });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      const list: any[] =
        (json && (json.data ?? json)) && Array.isArray(json.data ?? json)
          ? json.data ?? json
          : [];

      setData(
        list.map((item: any) => ({
          ...item,
          id: item.id || item.requestId || item.requestID || crypto.randomUUID(),
        }))
      );
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách yêu cầu điều chuyển");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // load requests
    loadData();

    // load vehicle models để chọn vehicleModelId
    (async () => {
      try {
        const res = await fetch("/api/vehicle-model/list", {
          cache: "no-store",
        });
        const text = await res.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }

        const list: any[] =
          (json && (json.data ?? json)) && Array.isArray(json.data ?? json)
            ? json.data ?? json
            : [];

        setModels(
          list.map((m: any) => ({
            vehicleModelId: m.vehicleModelId,
            modelName: m.modelName,
          }))
        );
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);

      const res = await fetch("/api/vehicle-transfer-request/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (!res.ok || json?.success === false) {
        message.error(json?.message || "Tạo yêu cầu điều chuyển thất bại");
        return;
      }

      message.success("Đã tạo yêu cầu điều chuyển xe");
      setCreateOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      if (err?.errorFields) {
        message.warning("Vui lòng điền đầy đủ thông tin");
      } else {
        console.error(err);
        message.error("Có lỗi xảy ra");
      }
    } finally {
      setCreating(false);
    }
  };

  // Manager chỉ được hủy yêu cầu của chi nhánh mình
  const handleCancel = async (id: string) => {
    try {
      const url = `/api/vehicle-transfer-request/${id}/cancel`;
      const res = await fetch(url, { method: "PUT" });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (!res.ok || json?.success === false) {
        message.error(json?.message || "Thao tác thất bại");
        return;
      }

      message.success("Đã hủy yêu cầu điều chuyển");
      loadData();
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra");
    }
  };

  const columns = [
    { title: "Mã yêu cầu", dataIndex: "id", key: "id" },
    {
      title: "Mẫu xe",
      dataIndex: "vehicleModelName",
      key: "vehicleModelName",
      render: (_: any, record: any) =>
        record.vehicleModelName || record.vehicleModelId || "-",
    },
    {
      title: "Số lượng",
      dataIndex: "quantityRequested",
      key: "quantityRequested",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        const status = (s || "Pending") as string;
        let color: string = "default";
        let label: string = status;
        
        // Map status to Vietnamese
        if (status === "Pending") {
          color = "orange";
          label = "Đang chờ";
        } else if (status === "Approved") {
          color = "green";
          label = "Đã duyệt";
        } else if (status === "Cancelled") {
          color = "red";
          label = "Đã hủy";
        } else if (status === "Rejected") {
          color = "red";
          label = "Từ chối";
        }
        
        return <Tag color={color}>{label}</Tag>;
      },
    },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            size="small"
            danger
            disabled={(record.status || "Pending") !== "Pending"}
            onClick={() => handleCancel(record.id)}
          >
            Hủy
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Điều chuyển xe</h1>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Tạo yêu cầu điều chuyển
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns as any}
        dataSource={data}
        locale={{ emptyText: "Chưa có yêu cầu điều chuyển nào" }}
      />

      <Modal
        title="Tạo yêu cầu điều chuyển xe"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="Gửi yêu cầu"
        confirmLoading={creating}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Mẫu xe cần điều chuyển"
            name="vehicleModelId"
            rules={[{ required: true, message: "Vui lòng chọn mẫu xe" }]}
          >
            <Select
              placeholder="Chọn mẫu xe"
              options={models.map((m) => ({
                label: m.modelName,
                value: m.vehicleModelId,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            label="Số lượng yêu cầu"
            name="quantityRequested"
            rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập lý do điều chuyển" }]}
          >
            <Input.TextArea rows={3} placeholder="Lý do điều chuyển" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


