"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  deadline: Date;
}

export default function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const underOneDay = timeLeft.days === 0;
  const RED = "#DC2626";
  const BLACK = "#000000";

  const numberColor = (alwaysRed: boolean) =>
    alwaysRed || underOneDay ? RED : BLACK;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        lineHeight: "normal",
        color: BLACK,
      }}
    >
      {/* Days */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 700,
            lineHeight: "normal",
            color: numberColor(false),
            margin: 0,
          }}
        >
          {timeLeft.days}
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            lineHeight: "normal",
            color: BLACK,
            margin: 0,
          }}
        >
          Days
        </p>
      </div>

      {/* Hours */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 700,
            lineHeight: "normal",
            color: numberColor(false),
            margin: 0,
          }}
        >
          {timeLeft.hours}
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            lineHeight: "normal",
            color: BLACK,
            margin: 0,
          }}
        >
          Hours
        </p>
      </div>

      {/* Minutes */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 700,
            lineHeight: "normal",
            color: numberColor(false),
            margin: 0,
          }}
        >
          {timeLeft.minutes}
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            lineHeight: "normal",
            color: BLACK,
            margin: 0,
          }}
        >
          Minutes
        </p>
      </div>

      {/* Seconds */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 700,
            lineHeight: "normal",
            color: numberColor(true),
            margin: 0,
          }}
        >
          {timeLeft.seconds}
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            lineHeight: "normal",
            color: BLACK,
            margin: 0,
          }}
        >
          Seconds
        </p>
      </div>
    </div>
  );
}
