export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      width="80"
      height="30"
      viewBox="0 0 80 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="55mas"
    >
      <g clipPath="url(#logo-clip)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M79.9836 7.75777H72.2259V0H65.5483V7.75777H57.7414V14.4354H65.5483V22.1931H72.2259V14.4354H79.9836V7.75777ZM22.1931 14.4354V7.75778H6.67758H0V14.4354V30H6.67758V14.4354H22.1931ZM17.7741 18.9034C11.6367 18.9034 6.67758 23.8625 6.67758 30H13.3552C13.3552 27.545 15.3192 25.581 17.7741 25.581C20.2291 25.581 22.1931 27.545 22.1931 30L28.8707 30L28.8707 30L35.5483 30L42.2259 30C42.2259 27.545 44.1898 25.581 46.6448 25.581C49.0998 25.581 51.0638 27.545 51.0638 30H57.7414C57.7414 23.8625 52.7823 18.9034 46.6448 18.9034C40.5074 18.9034 35.5483 23.8625 35.5483 30V14.4354H51.1129V7.75778H35.5483H28.8707V14.4354V29.9814C28.8607 23.8525 23.9054 18.9034 17.7741 18.9034Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="logo-clip">
          <rect width="80" height="30" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
