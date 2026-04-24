"use client";

import { Brain, Globe2, Radio, Smartphone } from "lucide-react";
import type { IconType } from "react-icons";
import {
  SiAmazon,
  SiCplusplus,
  SiFastapi,
  SiFigma,
  SiGithub,
  SiJira,
  SiJavascript,
  SiMongodb,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPython,
  SiReact,
  SiSupabase,
  SiSwift,
  SiTypescript,
  SiXcode,
} from "react-icons/si";

export const homeHighlightIconMap = {
  globe: Globe2,
  smartphone: Smartphone,
  brain: Brain,
  radio: Radio,
} as const;

export const skillIconMap: Record<string, IconType> = {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiNextdotjs,
  SiSwift,
  SiPython,
  SiCplusplus,
  SiNodedotjs,
  SiFastapi,
  SiSupabase,
  SiPostgresql,
  SiMongodb,
  SiGithub,
  SiFigma,
  SiXcode,
  SiJira,
  SiAmazon,
};
