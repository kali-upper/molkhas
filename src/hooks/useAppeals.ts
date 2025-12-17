import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Appeal } from "../types/database";

export function useAppeals() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appeals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAppeals(data || []);
    } catch (error) {
      console.error("Error fetching appeals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, []);

  return {
    appeals,
    loading,
    fetchAppeals,
  };
}
