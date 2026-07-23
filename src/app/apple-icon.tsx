import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#23203A",
        }}
      >
        <svg width="130" height="130" viewBox="0 0 40 40" fill="none">
          <ellipse
            cx="20"
            cy="20"
            rx="14"
            ry="6.5"
            stroke="#C9A15E"
            strokeWidth="1.1"
            strokeDasharray="3 3"
            transform="rotate(-22 20 20)"
          />
          <path
            d="M11 25c4-1.4 10.5-5.4 15.5-11"
            stroke="#E8DCC0"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="26.5" cy="14" r="2.4" fill="#E8DCC0" />
          <path
            d="m31.5 24 .9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9Z"
            fill="#C9A15E"
          />
        </svg>
      </div>
    ),
    size,
  );
}
