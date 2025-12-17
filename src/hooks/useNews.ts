import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { News, Database } from "../types/database";

export function useNews() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNews, setShowAddNews] = useState(false);
  const [newNews, setNewNews] = useState<
    Database["public"]["Tables"]["news"]["Insert"]
  >({
    title: "",
    content: "",
    type: "announcement",
    priority: 0,
    created_by: null,
  });

  const fetchNews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNews = async () => {
    try {
      const { error } = await supabase
        .from("news")
        .insert([newNews]);

      if (error) throw error;

      setNewNews({
        title: "",
        content: "",
        type: "announcement",
        priority: 0,
        created_by: null,
      });
      setShowAddNews(false);
      await fetchNews();
    } catch (error) {
      console.error("Error adding news:", error);
    }
  };

  const toggleNewsStatus = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from("news")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
      await fetchNews();
    } catch (error) {
      console.error("Error toggling news status:", error);
    }
  };

  const deleteNews = async (id: string) => {
    try {
      const { error } = await supabase
        .from("news")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return {
    news,
    loading,
    showAddNews,
    setShowAddNews,
    newNews,
    setNewNews,
    fetchNews,
    addNews,
    toggleNewsStatus,
    deleteNews,
  };
}
