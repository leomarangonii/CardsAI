interface NavItem {
  href: "/study" | "/progress" | "/settings";
  label: string;
  icon: string;
  badge?: number;
}

export const navItems: NavItem[] = [
  { href: "/study", label: "Estudar", icon: "🗂️" },
  { href: "/progress", label: "Progresso", icon: "📈" },
  { href: "/settings", label: "Config", icon: "⚙️" },
];
