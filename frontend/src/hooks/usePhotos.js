import { useState, useEffect } from "react";

export function usePhotos(authData, handleLogout, viewMode, apiBase = "/api") {
  const [photos, setPhotos] = useState([]);
  const [user, setUser] = useState(null);
  const [groupedPhotos, setGroupedPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [groupedLoading, setGroupedLoading] = useState(false);
  const [filters, setFilters] = useState({
    families: [],
    persons: [],
    countries: [],
  });
  const [selectedFamily, setSelectedFamily] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [groupKey, setGroupKey] = useState("family"); // 'family', 'person', 'location'
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Load filters on login
  useEffect(() => {
    async function loadFilters() {
      if (!authData.sid || !authData.synotoken) return;
      try {
        const filtersRes = await fetch(`${apiBase}/filters`, {
          credentials: "include",
        });
        if (filtersRes.ok) {
          const filtersData = await filtersRes.json();
          setFilters(filtersData);
        }
      } catch (err) {
        console.error("Failed to fetch filters:", err);
      }
    }
    loadFilters();
  }, [authData.sid, authData.synotoken]);

  // Fetch photos whenever filters change
  useEffect(() => {
    async function fetchPhotos() {
      if (!authData.sid || !authData.synotoken) return;
      try {
        setPhotosLoading(true);

        const params = new URLSearchParams();
        if (selectedFamily) params.append("family", selectedFamily);
        if (selectedPerson) params.append("person", selectedPerson);
        if (selectedCountry) params.append("country", selectedCountry);

        const queryString = params.toString() ? `?${params.toString()}` : "";
        const photosRes = await fetch(`${apiBase}/photos${queryString}`, {
          credentials: "include",
        });

        if (!photosRes.ok) {
          if (photosRes.status === 401) {
            handleLogout();
            return;
          }
          const errorData = await photosRes.json().catch(() => ({}));
          const errorMsg =
            errorData.details ||
            errorData.error ||
            `Status ${photosRes.status}`;
          throw new Error(`Backend error: ${errorMsg}`);
        }

        const photosData = await photosRes.json();
        setPhotos(photosData.photos || []);
        if (photosData.owner) setUser(photosData.owner);
      } catch (err) {
        console.error("Failed to fetch photos:", err);
      } finally {
        setPhotosLoading(false);
      }
    }
    fetchPhotos();
  }, [authData.sid, authData.synotoken, selectedFamily, selectedPerson, selectedCountry]);

  // Fetch grouped photos
  useEffect(() => {
    async function fetchGroupedPhotos() {
      if (!authData.sid || !authData.synotoken || viewMode !== "group") return;
      try {
        setGroupedLoading(true);
        setExpandedGroups({});
        const res = await fetch(`${apiBase}/photos/grouped?by=${groupKey}`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) {
            handleLogout();
            return;
          }
          throw new Error(`Backend error: status ${res.status}`);
        }
        const data = await res.json();
        setGroupedPhotos(data || []);
      } catch (err) {
        console.error("Failed to fetch grouped photos:", err);
      } finally {
        setGroupedLoading(false);
      }
    }
    fetchGroupedPhotos();
  }, [authData.sid, authData.synotoken, viewMode, groupKey]);

  const resetFilters = () => {
    setSelectedFamily("");
    setSelectedPerson("");
    setSelectedCountry("");
  };

  return {
    photos,
    setPhotos,
    user,
    setUser,
    groupedPhotos,
    setGroupedPhotos,
    photosLoading,
    groupedLoading,
    filters,
    setFilters,
    selectedFamily,
    setSelectedFamily,
    selectedPerson,
    setSelectedPerson,
    selectedCountry,
    setSelectedCountry,
    groupKey,
    setGroupKey,
    expandedGroups,
    toggleGroup,
    resetFilters,
  };
}
