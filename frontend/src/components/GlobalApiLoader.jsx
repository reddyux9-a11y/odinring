import { useEffect, useState } from "react";
import { useApiLoading } from "../contexts/ApiLoadingContext";

// A subtle, non-blocking top loader to reduce "app feels stuck" moments.
// Uses a short delay to avoid flicker for fast requests.
export default function GlobalApiLoader() {
  const { inFlightCount } = useApiLoading();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (inFlightCount > 0) {
      const t = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [inFlightCount]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[250]">
      <div className="h-1 w-full overflow-hidden bg-transparent">
        <div className="h-full w-1/3 bg-primary/70 animate-[loading_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

