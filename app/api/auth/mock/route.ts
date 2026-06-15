import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const tenantId = formData.get("tenantId") as string;

    if (!email || !tenantId) {
      return NextResponse.json(
        { error: "Email and Tenant ID are required" },
        { status: 400 }
      );
    }

    // Create a mock user ID for development based on the email
    const userId = `mock-user-${Buffer.from(email).toString("base64").substring(0, 8)}`;

    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    // Set mock session cookies (valid for 24 hours)
    const maxAge = 24 * 60 * 60;
    
    response.cookies.set("mock_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    response.cookies.set("mock_tenant_id", tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    response.cookies.set("mock_email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Mock auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
