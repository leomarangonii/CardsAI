"use client";

import { getUserTimezone } from "@/lib/date";

export function TimezoneLabel() {
  return <>{getUserTimezone()}</>;
}
