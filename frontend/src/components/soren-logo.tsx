interface SorenLogoProps {
  className?: string;
}

export function SorenLogo({ className = "h-6 w-6" }: SorenLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      fill="currentColor"
      className={className}
    >
      <g transform="translate(0,200) scale(0.1,-0.1)">
        <path d="M810 1644 c-256 -55 -470 -292 -470 -522 0 -56 14 -82 46 -82 25 0 63 27 419 306 296 230 286 222 283 257 -2 22 -11 35 -28 44 -33 17 -167 15 -250 -3z M1254 1508 c-41 -13 -769 -563 -805 -608 -39 -49 -55 -113 -40 -167 16 -59 105 -179 176 -236 209 -171 504 -195 735 -60 79 46 183 149 228 225 140 237 117 539 -58 756 -73 90 -148 118 -236 90z" />
      </g>
    </svg>
  );
}
