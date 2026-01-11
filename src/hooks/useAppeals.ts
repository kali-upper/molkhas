import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Appeal } from "../types/database";
import { useNotifications } from "./useNotifications";
import { useAuth } from "../contexts/AuthContext";

export function useAppeals() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  const { notifyUser } = useNotifications();
  const { user } = useAuth();

  const fetchAppeals = useCallback(async () => {
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
  }, []);
  const deleteAppeal = useCallback(async (id: string) => {
    try {
      if (!confirm("هل أنت متأكد أنك تريد حذف هذا الطعن؟")) return;

      const { error } = await supabase.from("appeals").delete().eq("id", id);

      if (error) throw error;

      setAppeals((prev) => prev.filter((appeal) => appeal.id !== id));
    } catch (error) {
      console.error("Error deleting appeal:", error);
      alert("حدث خطأ أثناء حذف الطعن.");
    }
  }, []);

  const acceptAppeal = useCallback(async (id: string, userId: string, contentTitle: string) => {
    try {
      if (!confirm("هل أنت متأكد أنك تريد قبول هذا الطعن؟")) return;

      const { error } = await supabase
        .from("appeals")
        .update({ status: "accepted", reviewed_by: user?.id })
        .eq("id", id);

      if (error) throw error;

      setAppeals((prev) =>
        prev.map((appeal) =>
          appeal.id === id ? { ...appeal, status: "accepted" } : appeal
        )
      );
      notifyUser(
        userId,
        "تم قبول طعنك!",
        `تم قبول طعنك على ${contentTitle}. شكرا لمساهمتك. `,
        "appeal_status_update",
        id,
        "appeal"
      );
    } catch (error) {
      console.error("Error accepting appeal:", error);
      alert("حدث خطأ أثناء قبول الطعن.");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rejectAppeal = useCallback(async (id: string, userId: string, contentTitle: string) => {
    try {
      if (!confirm("هل أنت متأكد أنك تريد رفض هذا الطعن؟")) return;

      const { error } = await supabase
        .from("appeals")
        .update({ status: "rejected", reviewed_by: user?.id })
        .eq("id", id);

      if (error) throw error;

      setAppeals((prev) =>
        prev.map((appeal) =>
          appeal.id === id ? { ...appeal, status: "rejected" } : appeal
        )
      );
      notifyUser(
        userId,
        "تم رفض طعنك.",
        `تم رفض طعنك على ${contentTitle}. يمكنك مراجعة السبب إذا تم توفيره. `,
        "appeal_status_update",
        id,
        "appeal"
      );
    } catch (error) {
      console.error("Error rejecting appeal:", error);
      alert("حدث خطأ أثناء رفض الطعن.");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAppeals();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    appeals,
    loading,
    fetchAppeals,
    deleteAppeal,
    acceptAppeal,
    rejectAppeal,
  };
}
