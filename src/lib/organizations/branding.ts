import type { CSSProperties } from "react";
// Pick the higher-contrast text color for configurable company colors.
export function contrastingText(hex: string) {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((value) => parseInt(value, 16) / 255) ?? [0, 0, 0];
  const linear = rgb.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  const luminance =
    linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
    ? "#000000"
    : "#ffffff";
}
export function organizationTheme(organization: {
  primary_color: string;
  secondary_color: string;
}): CSSProperties {
  return {
    "--primary": organization.primary_color,
    "--primary-foreground": contrastingText(organization.primary_color),
    "--secondary": organization.secondary_color,
    "--secondary-foreground": contrastingText(organization.secondary_color),
  } as CSSProperties;
}
