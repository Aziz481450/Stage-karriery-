function Ico({ size = 24, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const IconUsers = (p) => (
  <Ico {...p}>
    <circle cx="9.2" cy="8" r="3.3" />
    <path d="M3.6 19c.5-3.1 2.8-4.9 5.6-4.9s5.1 1.8 5.6 4.9" />
    <path d="M15.8 5.5a3.3 3.3 0 0 1 0 6" />
    <path d="M17.4 14.6c1.9.7 3 2.2 3.3 4.4" />
  </Ico>
);

export const IconFileUp = (p) => (
  <Ico {...p}>
    <path d="M13.8 3H7.6A2.1 2.1 0 0 0 5.5 5.1v13.8A2.1 2.1 0 0 0 7.6 21h8.8a2.1 2.1 0 0 0 2.1-2.1V7.7z" />
    <path d="M13.8 3v4.7h4.7" />
    <path d="M12 18.2v-5.6" />
    <path d="M9.7 14.9 12 12.6l2.3 2.3" />
  </Ico>
);

export const IconSparkles = (p) => (
  <Ico {...p}>
    <path d="M11 3.5l1.7 4.3 4.3 1.7-4.3 1.7L11 15.5 9.3 11.2 5 9.5l4.3-1.7z" />
    <path d="M17.5 14.8l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </Ico>
);

export const IconUserCheck = (p) => (
  <Ico {...p}>
    <circle cx="9.2" cy="8" r="3.3" />
    <path d="M3.6 19c.5-3.1 2.8-4.9 5.6-4.9 1.1 0 2.1.3 3 .8" />
    <path d="M14.8 17.2l2.1 2.1 4.1-4.6" />
  </Ico>
);

export const IconChat = (p) => (
  <Ico {...p}>
    <path d="M20.5 11.6a7.7 7.7 0 0 1-11.4 6.8L4 20l1.6-4.6A7.7 7.7 0 1 1 20.5 11.6z" />
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
  </Ico>
);

export const IconBell = (p) => (
  <Ico {...p}>
    <path d="M18 15.2V10a6 6 0 1 0-12 0v5.2L4.6 18h14.8z" />
    <path d="M10 21h4" />
  </Ico>
);

export const IconUserPlus = (p) => (
  <Ico {...p}>
    <circle cx="9.2" cy="8" r="3.3" />
    <path d="M3.6 19c.5-3.1 2.8-4.9 5.6-4.9" />
    <path d="M16.5 12.5v6M13.5 15.5h6" />
  </Ico>
);

export const IconUpload = (p) => (
  <Ico {...p}>
    <path d="M12 15.8V4.5" />
    <path d="M8.2 8.3 12 4.5l3.8 3.8" />
    <path d="M4.5 14.8v3.4a2.1 2.1 0 0 0 2.1 2.1h10.8a2.1 2.1 0 0 0 2.1-2.1v-3.4" />
  </Ico>
);

export const IconCheckCircle = (p) => (
  <Ico {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M8.3 12.4l2.6 2.6 4.8-5.4" />
  </Ico>
);

export const IconMail = (p) => (
  <Ico {...p}>
    <rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.4" />
    <path d="m4.4 7.6 7.6 5.2 7.6-5.2" />
  </Ico>
);

export const IconPhone = (p) => (
  <Ico {...p}>
    <path d="M6.4 3.6h3.1l1.5 4-2.1 1.5a12.4 12.4 0 0 0 5.9 5.9l1.5-2.1 4 1.5v3.1a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 4.4 5.8a2 2 0 0 1 2-2.2z" />
  </Ico>
);

export const IconInstagram = (p) => (
  <Ico {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.9" />
    <circle cx="17.1" cy="6.9" r="1.05" fill="currentColor" stroke="none" />
  </Ico>
);

export const IconLinkedin = (p) => (
  <Ico {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3.2" />
    <circle cx="8" cy="8" r="1.15" fill="currentColor" stroke="none" />
    <path d="M8 11.4V17" />
    <path d="M12 11.4V17" />
    <path d="M12 14a2.6 2.6 0 0 1 5.2 0v3" />
  </Ico>
);

export const IconYoutube = (p) => (
  <Ico {...p}>
    <rect x="2.8" y="5.4" width="18.4" height="13.2" rx="4" />
    <path d="M10.3 9.3l5.1 2.7-5.1 2.7z" />
  </Ico>
);

export const IconArrowRight = (p) => (
  <Ico {...p}>
    <path d="M4.5 12h14" />
    <path d="m13.2 6.3 5.7 5.7-5.7 5.7" />
  </Ico>
);

export const IconChevronRight = (p) => (
  <Ico {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </Ico>
);

export const IconPlay = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M8 5.2v13.6L19 12z" />
  </svg>
);

export const IconFolder = (p) => (
  <Ico {...p}>
    <path d="M3.2 6.4A2.1 2.1 0 0 1 5.3 4.3h4l1.9 2.1h7.5a2.1 2.1 0 0 1 2.1 2.1v9.2a2.1 2.1 0 0 1-2.1 2.1H5.3a2.1 2.1 0 0 1-2.1-2.1z" />
  </Ico>
);

export const IconTrend = (p) => (
  <Ico {...p}>
    <path d="M4 17l5-5 3.5 3.5L20 8" />
    <path d="M15.5 8H20v4.5" />
  </Ico>
);

export const IconLogout = (p) => (
  <Ico {...p}>
    <path d="M14.5 4.5H7.8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6.7" />
    <path d="M17 8.5 20.5 12 17 15.5" />
    <path d="M10.5 12H20.5" />
  </Ico>
);

export const IconDoc = (p) => (
  <Ico {...p}>
    <path d="M14 3H8.2a2.1 2.1 0 0 0-2.1 2.1v13.8A2.1 2.1 0 0 0 8.2 21h7.6a2.1 2.1 0 0 0 2.1-2.1V7z" />
    <path d="M14 3v4h4" />
    <path d="M9.5 12h5M9.5 15.5h5" />
  </Ico>
);

export const IconPin = (p) => (
  <Ico {...p}>
    <path d="M12 21.5s6.5-5.4 6.5-10.5a6.5 6.5 0 1 0-13 0c0 5.1 6.5 10.5 6.5 10.5z" />
    <circle cx="12" cy="11" r="2.4" />
  </Ico>
);

export const IconCalendar = (p) => (
  <Ico {...p}>
    <rect x="3.5" y="5.2" width="17" height="15.3" rx="2.3" />
    <path d="M3.8 9.6h16.4M8 3.5v3.6M16 3.5v3.6" />
  </Ico>
);

export const IconTarget = (p) => (
  <Ico {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </Ico>
);

export const IconGauge = (p) => (
  <Ico {...p}>
    <path d="M20.5 15.5A8.6 8.6 0 1 0 3.5 15.5" />
    <path d="M12 15.5l4.6-6.2" />
    <circle cx="12" cy="15.5" r="1.6" />
  </Ico>
);

export const IconInbox = (p) => (
  <Ico {...p}>
    <path d="M3.5 5.5A2 2 0 0 1 5.5 3.5h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    <path d="M3.5 10h4.4l1.4 2h5.4l1.4-2h4.4" />
  </Ico>
);

export const IconClock = (p) => (
  <Ico {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.2V12l3 3" />
  </Ico>
);

export const IconBrain = (p) => (
  <Ico {...p}>
    <path d="M12 4.5A3.5 3.5 0 0 0 8.7 7.6a3.4 3.4 0 0 0-4.2 3.7 3.4 3.4 0 0 0 1.6 5.9 3.4 3.4 0 0 0 5.4 2.5v-13z" />
    <path d="M12 4.5A3.5 3.5 0 0 1 15.3 7.6a3.4 3.4 0 0 1 4.2 3.7 3.4 3.4 0 0 1-1.6 5.9 3.4 3.4 0 0 1-5.4 2.5v-13z" />
  </Ico>
);

export const IconWarning = (p) => (
  <Ico {...p}>
    <path d="M12 4 3.5 19.2h17z" />
    <path d="M12 9.4v4.4" />
    <circle cx="12" cy="16.6" r="0.4" fill="currentColor" stroke="none" />
  </Ico>
);

export const IconSearch = (p) => (
  <Ico {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Ico>
);
