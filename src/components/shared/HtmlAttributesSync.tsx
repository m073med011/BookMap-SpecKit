"use client";

import { useEffect } from "react";
import type { Direction, Locale } from "@/types";

type HtmlAttributesSyncProps = {
  direction: Direction;
  locale: Locale;
};

export function HtmlAttributesSync({
  direction,
  locale,
}: HtmlAttributesSyncProps) {
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
  }, [direction, locale]);

  return null;
}
