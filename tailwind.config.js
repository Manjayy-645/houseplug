/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "secondary": "#855300",
        "on-primary-container": "#86af99",
        "surface-variant": "#dce2f3",
        "on-secondary-fixed-variant": "#653e00",
        "error-container": "#ffdad6",
        "on-tertiary-fixed": "#002113",
        "on-secondary-container": "#684000",
        "inverse-on-surface": "#ebf1ff",
        "tertiary": "#002d1c",
        "on-tertiary": "#ffffff",
        "secondary-container": "#fea619",
        "on-error": "#ffffff",
        "inverse-primary": "#a5d0b9",
        "on-tertiary-fixed-variant": "#005236",
        "on-error-container": "#93000a",
        "error": "#ba1a1a",
        "on-surface": "#151c27",
        "on-primary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "on-secondary-fixed": "#2a1700",
        "tertiary-container": "#00452d",
        "on-background": "#151c27",
        "inverse-surface": "#2a313d",
        "outline": "#717973",
        "background": "#f9f9ff",
        "primary-fixed": "#c1ecd4",
        "on-primary-fixed": "#002114",
        "surface-tint": "#3f6653",
        "surface-container-high": "#e2e8f8",
        "surface-container-low": "#f0f3ff",
        "surface-container": "#e7eefe",
        "on-tertiary-container": "#1abc84",
        "surface-container-highest": "#dce2f3",
        "surface": "#f9f9ff",
        "secondary-fixed-dim": "#ffb95f",
        "on-secondary": "#ffffff",
        "outline-variant": "#c1c8c2",
        "primary": "#012d1d",
        "on-surface-variant": "#414844",
        "primary-fixed-dim": "#a5d0b9",
        "surface-dim": "#d3daea",
        "secondary-fixed": "#ffddb8",
        "surface-bright": "#f9f9ff",
        "on-primary-fixed-variant": "#274e3d",
        "tertiary-fixed": "#6ffbbe",
        "primary-container": "#1b4332",
        "tertiary-fixed-dim": "#4edea3",
        // Keeping original core colors for backward compatibility if any
        "hp-green": "#1B4332",
        "hp-amber": "#F59E0B",
        "hp-verified": "#10B981"
      },
      spacing: {
        "md": "16px",
        "xl": "32px",
        "lg": "24px",
        "base": "4px",
        "gutter": "16px",
        "sm": "12px",
        "container-margin": "20px",
        "xs": "8px"
      },
      fontSize: {
        "display-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "label-lg": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        "title-md": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "title-lg": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "display-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }]
      }
    }
  },
  plugins: []
}

