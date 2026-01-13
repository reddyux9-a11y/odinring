import * as Icons from "lucide-react";

export function getIconByName(name, className = "w-4 h-4") {
  try {
    const Icon = Icons[name] || Icons.Globe;
    return <Icon className={className} />;
  } catch {
    const Fallback = Icons.Globe;
    return <Fallback className={className} />;
  }
}


