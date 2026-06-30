import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'Source Sans 3'", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slow-zoom": {
          "0%": { transform: "scale(1) translate(0, 0)" },
          "50%": { transform: "scale(1.08) translate(-1%, -0.5%)" },
          "100%": { transform: "scale(1) translate(0, 0)" },
        },
        "firefly-float": {
          "0%": { transform: "translate(0, 0) scale(1)", opacity: "0" },
          "15%": { opacity: "1" },
          "50%": { transform: "translate(40px, -60px) scale(1.2)", opacity: "0.8" },
          "85%": { opacity: "1" },
          "100%": { transform: "translate(-20px, -100px) scale(0.8)", opacity: "0" },
        },
        "guest-visit": {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.9)" },
          "10%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "85%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-10px) scale(0.95)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", textShadow: "0 0 7px hsl(var(--primary)), 0 0 10px hsl(var(--primary)), 0 0 21px hsl(var(--primary))" },
          "50%": { opacity: "0.85", textShadow: "0 0 14px hsl(var(--primary)), 0 0 20px hsl(var(--primary)), 0 0 42px hsl(var(--primary))" },
        },
        "drift-mote": {
          "0%": { transform: "translate(0, 0)", opacity: "0" },
          "10%": { opacity: "0.6" },
          "90%": { opacity: "0.4" },
          "100%": { transform: "translate(80px, -120px)", opacity: "0" },
        },
        "drift-fog": {
          "0%": { transform: "translateX(0)", opacity: "0" },
          "20%": { opacity: "1" },
          "80%": { opacity: "1" },
          "100%": { transform: "translateX(200px)", opacity: "0" },
        },
        "rain-grain": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "10%": { opacity: "0.3" },
          "90%": { opacity: "0.2" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        "leaf-fall": {
          "0%": { transform: "translate(0, 0) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "0.7" },
          "100%": { transform: "translate(120px, 100vh) rotate(360deg)", opacity: "0" },
        },
        "bird-cross": {
          "0%": { transform: "translateX(-40px)" },
          "100%": { transform: "translateX(calc(100vw + 40px))" },
        },
        "light-pulse": {
          "0%": { opacity: "0" },
          "30%": { opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translate(-50%, -20px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slow-zoom": "slow-zoom 30s ease-in-out infinite",
        "firefly-float": "firefly-float 6s ease-in-out infinite",
        "guest-visit": "guest-visit 10s ease-in-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "leaf-fall": "leaf-fall 10s ease-in-out forwards",
        "bird-cross": "bird-cross 6s linear forwards",
        "light-pulse": "light-pulse 5s ease-in-out forwards",
        "flora-sprout": "flora-sprout 0.8s ease-out both",
        "slide-down": "slide-down 0.3s ease-out forwards",
        "scale-in": "scale-in 0.2s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
