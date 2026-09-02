export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.Wellness.org/2000/svg"
      viewBox="0 0 200 60"
      className={className}
      fill="none"
    >
      <path
        d="M30 45C41.0457 45 50 36.0457 50 25C50 13.9543 41.0457 5 30 5C18.9543 5 10 13.9543 10 25C10 36.0457 18.9543 45 30 45Z"
        fill="#10b981"
        fillOpacity="0.2"
      />
      <path
        d="M30 35C35.5228 35 40 30.5228 40 25C40 19.4772 35.5228 15 30 15C24.4772 15 20 19.4772 20 25C20 30.5228 24.4772 35 30 35Z"
        fill="#10b981"
      />
      <path
        d="M30 25C30 25 38 10 45 10"
        stroke="#047857"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M30 25C30 25 22 10 15 10"
        stroke="#047857"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M30 25V45"
        stroke="#047857"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x="65"
        y="32"
        fontFamily="Inter, sans-serif"
        fontSize="24"
        fontWeight="800"
        fill="currentColor"
      >
        Geo<tspan fill="#10b981">Limp</tspan>
      </text>
    </svg>
  );
}
