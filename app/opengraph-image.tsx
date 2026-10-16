import { ImageResponse } from "next/og";

export const alt = "MÓ Gift Box – Gói trọn yêu thương trong từng hộp quà";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Ảnh chia sẻ mặc định khi gửi link lên Facebook/Zalo. [[Thay bằng ảnh chụp hộp quà thật nếu có]] */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F5EBDD", padding: "80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
          <div style={{ fontSize: 140, fontWeight: 900, color: "#6B3E26", lineHeight: 1 }}>mó</div>
          <div style={{ fontSize: 28, letterSpacing: 14, color: "#6B3E26", fontWeight: 600 }}>GIFT BOX</div>
          <div style={{ fontSize: 44, color: "#2B1D14", lineHeight: 1.25, marginTop: 24 }}>Gói trọn yêu thương trong từng hộp quà</div>
        </div>
        <div style={{ width: 380, height: 380, background: "#C8A27A", borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ position: "absolute", width: 64, height: 380, background: "#E8A0B4", left: 158 }} />
          <div style={{ position: "absolute", width: 380, height: 64, background: "#E8A0B4", top: 120 }} />
        </div>
      </div>
    ),
    size,
  );
}
