import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Teal C Ring */}
          <path
            d="M 33 13 A 15 15 0 1 0 33 35"
            fill="none"
            stroke="#20a39e"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {/* Inner Mint Green Circle */}
          <circle cx="24" cy="24" r="9" fill="#2ecc71" />
          {/* White Checkmark */}
          <path
            d="M 20 24.5 L 22.5 27.5 L 28 21"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
