import { NextResponse } from "next/server";
import { emrsFetch } from "@/utils/emrsApi";

// API: POST /api/auth/login
// Nhận { username, password } từ FE, gọi BE /auth/login,
// set cookie và trả về thông tin user cho FE.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body ?? {};

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Thiếu username hoặc password" },
        { status: 400 }
      );
    }

    // Gọi BE thật
    const beRes = await emrsFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    let json: any;
    try {
      json = await beRes.json();
    } catch (e) {
      console.error("Login BFF parse error:", e);
      return NextResponse.json(
        { success: false, message: "Phản hồi từ máy chủ không hợp lệ" },
        { status: 502 }
      );
    }

    if (!beRes.ok || !json?.success) {
      console.error("Login BFF upstream error:", beRes.status, json);
      return NextResponse.json(
        {
          success: false,
          message: json?.message ?? "Sai tài khoản hoặc mật khẩu",
        },
        { status: beRes.status || 400 }
      );
    }

    const { accessToken, user } = json.data ?? {};

    if (!accessToken || !user) {
      console.error("Login BFF invalid payload:", json);
      return NextResponse.json(
        { success: false, message: "Dữ liệu đăng nhập không hợp lệ" },
        { status: 502 }
      );
    }

    const secure = process.env.NODE_ENV === "production";

    const res = NextResponse.json({
      success: true,
      data: { user },
    });

    // Set cookie an toàn
    res.cookies.set("token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });

    res.cookies.set("role", user.role ?? "", {
      httpOnly: false,
      path: "/",
    });

    res.cookies.set("fullName", user.fullName ?? "", {
      httpOnly: false,
      path: "/",
    });

    res.cookies.set("branchId", user.branchId ?? "", {
      httpOnly: false,
      path: "/",
    });

    res.cookies.set("branchName", user.branchName ?? "", {
      httpOnly: false,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Login BFF error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
