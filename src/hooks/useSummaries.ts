import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Summary, SummaryUpdate } from "../types/database";

export function useSummaries() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummaries = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error("Error fetching summaries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("summaries")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      await fetchSummaries();
    } catch (error) {
      console.error("Error updating summary status:", error);
    }
  };

  const editSummary = async (id: string, updates: Partial<SummaryUpdate>) => {
    try {
      const { error } = await supabase
        .from("summaries")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      await fetchSummaries();
    } catch (error) {
      console.error("Error editing summary:", error);
      throw error;
    }
  };

  const canEditSummary = (summary: Summary, currentUserId: string | undefined, isAdmin: boolean) => {
    if (!currentUserId) return false;
    return isAdmin || summary.user_id === currentUserId;
  };

  const canDeleteSummary = (summary: Summary, currentUserId: string | undefined, isAdmin: boolean) => {
    if (!currentUserId) return false;
    return isAdmin || summary.user_id === currentUserId;
  };

  const deleteSummary = async (id: string) => {
    try {
      const { error } = await supabase
        .from("summaries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchSummaries();
    } catch (error) {
      console.error("Error deleting summary:", error);
    }
  };

  const clearAllSummaries = async () => {
    try {
      const { error } = await supabase
        .from("summaries")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) throw error;
      await fetchSummaries();
    } catch (error) {
      console.error("Error clearing summaries:", error);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    summaries,
    loading,
    fetchSummaries,
    updateStatus,
    editSummary,
    canEditSummary,
    canDeleteSummary,
    deleteSummary,
    clearAllSummaries,
  };
}
