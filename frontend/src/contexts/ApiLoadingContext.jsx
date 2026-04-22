import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getInFlightCount, subscribeInFlightCount } from "../lib/apiLoading";

const ApiLoadingContext = createContext({ inFlightCount: 0 });

export function ApiLoadingProvider({ children }) {
  const [inFlightCount, setInFlightCount] = useState(() => getInFlightCount());

  useEffect(() => {
    return subscribeInFlightCount(setInFlightCount);
  }, []);

  const value = useMemo(() => ({ inFlightCount }), [inFlightCount]);

  return (
    <ApiLoadingContext.Provider value={value}>
      {children}
    </ApiLoadingContext.Provider>
  );
}

export function useApiLoading() {
  return useContext(ApiLoadingContext);
}

