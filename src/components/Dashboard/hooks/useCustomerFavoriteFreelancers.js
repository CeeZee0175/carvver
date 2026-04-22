import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

const supabase = createClient();

function normalizeSnapshot(snapshot, freelancerId) {
  if (!snapshot) return null;

  return {
    id: snapshot.id || freelancerId,
    display_name: snapshot.display_name || null,
    first_name: snapshot.first_name || null,
    last_name: snapshot.last_name || null,
    bio: snapshot.bio || null,
    avatar_url: snapshot.avatar_url || null,
    region: snapshot.region || null,
    city: snapshot.city || null,
    barangay: snapshot.barangay || null,
    freelancer_headline: snapshot.freelancer_headline || null,
  };
}

export function useCustomerFavoriteFreelancers({ includeProfiles = true, limit = 4 } = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favoriteFreelancers, setFavoriteFreelancers] = useState([]);
  const idsRef = useRef([]);
  const profilesRef = useRef([]);

  useEffect(() => {
    idsRef.current = favoriteIds;
  }, [favoriteIds]);

  useEffect(() => {
    profilesRef.current = favoriteFreelancers;
  }, [favoriteFreelancers]);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        setUserId(null);
        setFavoriteIds([]);
        setFavoriteFreelancers([]);
        return;
      }

      const currentUserId = session.user.id;
      setUserId(currentUserId);

      const { data: rows, error: favoriteError } = await supabase
        .from("customer_favorite_freelancers")
        .select("freelancer_id, created_at")
        .eq("customer_id", currentUserId)
        .order("created_at", { ascending: false });

      if (favoriteError) throw favoriteError;

      const orderedIds = (rows || [])
        .map((row) => row.freelancer_id)
        .filter(Boolean);

      setFavoriteIds(orderedIds);

      if (!includeProfiles || orderedIds.length === 0) {
        setFavoriteFreelancers([]);
        return;
      }

      const visibleIds = orderedIds.slice(0, limit);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, display_name, first_name, last_name, bio, avatar_url, region, city, barangay, freelancer_headline"
        )
        .in("id", visibleIds);

      if (profileError) throw profileError;

      const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
      setFavoriteFreelancers(
        visibleIds
          .map((freelancerId) => profileMap.get(freelancerId))
          .filter(Boolean)
      );
    } catch {
      setFavoriteIds([]);
      setFavoriteFreelancers([]);
      setError("We couldn't load your favorite freelancers.");
    } finally {
      setLoading(false);
    }
  }, [includeProfiles, limit]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavoriteFreelancer = useCallback(
    async (freelancerId, snapshot = null) => {
      const nextFreelancerId = String(freelancerId || "").trim();
      if (!nextFreelancerId) {
        throw new Error("Please choose a freelancer first.");
      }

      let currentUserId = userId;

      if (!currentUserId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          throw new Error("Please sign in to manage favorites.");
        }

        currentUserId = session.user.id;
        setUserId(currentUserId);
      }

      const wasFavorite = idsRef.current.includes(nextFreelancerId);
      const previousIds = idsRef.current;
      const previousProfiles = profilesRef.current;

      const nextIds = wasFavorite
        ? previousIds.filter((id) => id !== nextFreelancerId)
        : [nextFreelancerId, ...previousIds];

      setFavoriteIds(nextIds);

      if (includeProfiles) {
        if (wasFavorite) {
          setFavoriteFreelancers((prev) =>
            prev.filter((profile) => profile.id !== nextFreelancerId)
          );
        } else {
          const normalizedSnapshot = normalizeSnapshot(snapshot, nextFreelancerId);
          if (normalizedSnapshot) {
            setFavoriteFreelancers((prev) => {
              const nextProfiles = [
                normalizedSnapshot,
                ...prev.filter((profile) => profile.id !== nextFreelancerId),
              ];
              return nextProfiles.slice(0, limit);
            });
          }
        }
      }

      try {
        if (wasFavorite) {
          const { error: deleteError } = await supabase
            .from("customer_favorite_freelancers")
            .delete()
            .eq("customer_id", currentUserId)
            .eq("freelancer_id", nextFreelancerId);

          if (deleteError) throw deleteError;
        } else {
          const { error: insertError } = await supabase
            .from("customer_favorite_freelancers")
            .insert([
              {
                customer_id: currentUserId,
                freelancer_id: nextFreelancerId,
              },
            ]);

          if (insertError) throw insertError;
        }

        if (includeProfiles && !wasFavorite && !snapshot) {
          await loadFavorites();
        }

        return { favorite: !wasFavorite };
      } catch {
        setFavoriteIds(previousIds);
        if (includeProfiles) {
          setFavoriteFreelancers(previousProfiles);
        }
        throw new Error("We couldn't update your favorites. Please try again.");
      }
    },
    [includeProfiles, limit, loadFavorites, userId]
  );

  return {
    loading,
    error,
    userId,
    favoriteIds,
    favoriteFreelancers,
    reload: loadFavorites,
    toggleFavoriteFreelancer,
  };
}

export default useCustomerFavoriteFreelancers;
