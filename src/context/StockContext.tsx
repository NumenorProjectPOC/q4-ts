import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchFavoriteStocks } from "../services/quantiforeApi";

interface StockOption {
  label: string;
  value: string;
  guid: string;
}

interface StockContextType {
  stockOptions: StockOption[];
  setStockOptions: React.Dispatch<React.SetStateAction<StockOption[]>>;
  loading: boolean;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const cached = localStorage.getItem("favoriteStocks");
        if (cached) {
          setStockOptions(JSON.parse(cached));
          setLoading(false);
        } else {
          const fetched = await fetchFavoriteStocks();
          setStockOptions(fetched);
          localStorage.setItem("favoriteStocks", JSON.stringify(fetched));
        }
      } catch (err) {
        console.error("Error loading stocks", err);
      } finally {
        setLoading(false);
      }
    };

    loadStocks();
  }, []);

  return (
    <StockContext.Provider value={{ stockOptions, setStockOptions, loading }}>
      {children}
    </StockContext.Provider>
  );
};

export const useStockContext = () => {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error("useStockContext must be used within StockProvider");
  return ctx;
};
