import type { ReactNode } from "react";
import { hu } from "../hu";

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M7 10.5V20h10v-9.5" />
    </Svg>
  );
}

export function IconCards(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="4" width="11" height="14" rx="2" />
      <path d="M9 8h5M8 18h11v-9" />
    </Svg>
  );
}

export function IconPractice(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="12" r="3" />
      <circle cx="16" cy="8" r="3" />
      <circle cx="16" cy="16" r="3" />
    </Svg>
  );
}

export function IconTalk(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 16.5V7.5A2.5 2.5 0 0 1 7.5 5h6A2.5 2.5 0 0 1 16 7.5V13a2.5 2.5 0 0 1-2.5 2.5H9L5 19z" />
    </Svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.8 6.2l1.6 1.6M17.6 16.2l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.8 17.8l1.6-1.6M17.6 7.8l1.6-1.6" />
    </Svg>
  );
}

export function Tulip() {
  return (
    <svg className="tulip" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 58V36" stroke="#0e6b52" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M33 42c9 1 16 8 12 15" stroke="#0e6b52" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="28" r="11" fill="#d8574a" />
      <circle cx="42" cy="28" r="11" fill="#c4483a" />
      <circle cx="32" cy="16" r="10" fill="#f4efe6" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <Tulip />
      <span>{hu.appName}</span>
    </span>
  );
}
