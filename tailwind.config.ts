import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Claude风格配色 - 背景色
    'bg-[#F9F9F8]',
    'dark:bg-gray-900',
    // Claude风格配色 - 文本色
    'text-[#1A1A1A]',
    'text-[#585858]',
    'text-[#9A9A9A]',
    'dark:text-white',
    'dark:text-gray-400',
    // Claude风格配色 - 边框色
    'border-[#E8E8E6]',
    'border-[#F3F3F2]',
    'dark:border-gray-700',
    // Claude风格配色 - 主色
    'text-[#D97757]',
    'bg-[#D97757]',
    'hover:bg-[#C26647]',
    'focus:border-[#D97757]',
    'focus:ring-[#D97757]',
    'hover:text-[#D97757]',
    // Claude风格配色 - 语义色
    'text-[#5B8C5A]',
    'bg-[#5B8C5A]',
    'text-[#D97706]',
    'text-[#C53030]',
    'bg-[#C53030]',
    'text-[#0B7285]',
    // Claude风格配色 - 其他
    'bg-[#FFFFFF]',
    'bg-[#F3F3F2]',
    'bg-white',
    'dark:bg-gray-800',
    'dark:bg-gray-700',
    'dark:bg-gray-600',
    // 专用类
    'disabled:bg-[#9A9A9A]',
  ],
  theme: {
    extend: {
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
