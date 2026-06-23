import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";

import { getCookie, setCookie } from "./utils/cookies";
import AppHeader from "./components/AppHeader";
import LoginForm from "./components/LoginForm";
import Sidebar from "./components/Sidebar";
import FilterView from "./components/FilterView";
import GroupView from "./components/GroupView";
import GraphView from "./components/GraphView";
import PhotoDetailsModal from "./components/PhotoDetailsModal";
import { useAuth } from "./hooks/useAuth";
import { usePhotos } from "./hooks/usePhotos";
import { useLanguage } from "./hooks/useLanguage";

import "./App.css";

function App() {
  const API_BASE = import.meta.env.GRAPHSTATION_API_URL || "/graphstation-api";

  const { language, changeLanguage, t } = useLanguage();

  const {
    authData,
    loginForm,
    setLoginForm,
    loginError,
    isLoggingIn,
    handleLogin,
    handleLogout: handleAuthLogout,
    handleUserClick,
    checkAuth,
  } = useAuth(API_BASE);

  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [viewMode, setViewMode] = useState("group"); // 'group', 'filter', or 'graph'
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [selectedYear, setSelectedYear] = useState(null);

  const {
    photos,
    user,
    groupedPhotos,
    photosLoading,
    groupedLoading,
    filters,
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
    fetchMorePhotos,
    hasMore,
  } = usePhotos(authData, handleAuthLogout, viewMode, API_BASE, selectedYear, setSelectedYear);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [thumbnailSize, setThumbnailSize] = useState(() => {
    return getCookie("thumbnailSize") || "m";
  });

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoDetails, setPhotoDetails] = useState(null);
  const [clickedNode, setClickedNode] = useState(null);
  const overlayWasOpen = useRef(false);

  // --- Callbacks (Must be defined before useEffects that use them) ---

  const handleCloseOverlay = useCallback(
    (e) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      setSelectedPhoto(null);
      setClickedNode(null);
    },
    [setSelectedPhoto, setClickedNode],
  );

  // --- Effects (Must be called before any conditional returns) ---

  useEffect(() => {
    async function verifySession() {
      if (!authData.sid || !authData.synotoken) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const isValid = await checkAuth();
        if (!isValid) {
          handleAuthLogout();
        }
      } catch (err) {
        console.error("Error during session verification:", err);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    verifySession();
  }, []); // Only run once on mount

  useEffect(() => {
    setCookie("thumbnailSize", thumbnailSize, 14);
  }, [thumbnailSize]);

  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = "hidden";
      setPhotoDetails(null); // Reset while loading
      fetch(`${API_BASE}/photo/${selectedPhoto.id}/details`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setPhotoDetails(data);
          }
        })
        .catch((err) => console.error("Error fetching photo details:", err));
    } else {
      document.body.style.overflow = "";
      setPhotoDetails(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedPhoto, API_BASE]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCloseOverlay();
      }
    };
    if (selectedPhoto) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto, handleCloseOverlay]);

  useEffect(() => {
    const isOverlayOpen = !!(selectedPhoto || clickedNode);
    const currentHash = window.location.hash;

    if (isOverlayOpen && currentHash !== "#detail") {
      window.history.pushState(
        null,
        "",
        window.location.pathname + window.location.search + "#detail",
      );
      overlayWasOpen.current = true;
    } else if (!isOverlayOpen && currentHash === "#detail") {
      if (overlayWasOpen.current) {
        window.history.back();
        overlayWasOpen.current = false;
      } else {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    } else if (isOverlayOpen) {
      overlayWasOpen.current = true;
    } else {
      overlayWasOpen.current = false;
    }
  }, [selectedPhoto, clickedNode]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash !== "#detail") {
        if (selectedPhoto) setSelectedPhoto(null);
        if (clickedNode) setClickedNode(null);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [selectedPhoto, clickedNode]);

  useEffect(() => {
    async function loadGraphData() {
      if (!authData.sid || !authData.synotoken) return;
      try {
        setLoading(true);
        setError(null);

        const graphRes = await fetch(`${API_BASE}/graph?limit=30`, {
          credentials: "include",
        });
        if (!graphRes.ok) {
          if (graphRes.status === 401) {
            handleLogout();
            return;
          }
        } else {
          const gData = await graphRes.json();
          setGraphData(gData);
        }
      } catch (err) {
        console.error("Initial load failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadGraphData();
  }, [authData.sid, authData.synotoken, API_BASE]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Memoized values (Must be after all hooks) ---

  const filteredGraphData = useMemo(() => {
    const nodes = graphData.nodes.filter((n) => n.type !== "Object");
    const objectNodeIds = new Set(
      graphData.nodes.filter((n) => n.type === "Object").map((n) => n.id),
    );
    const links = graphData.links.filter((l) => {
      const sourceId = typeof l.source === "object" ? l.source.id : l.source;
      const targetId = typeof l.target === "object" ? l.target.id : l.target;
      return !objectNodeIds.has(sourceId) && !objectNodeIds.has(targetId);
    });
    return { nodes, links };
  }, [graphData]);

  const displayGraphData = useMemo(() => {
    if (!clickedNode) return filteredGraphData;

    const hops = new Map();
    hops.set(clickedNode.id, 0);

    filteredGraphData.links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;
      if (sourceId === clickedNode.id) hops.set(targetId, 1);
      if (targetId === clickedNode.id) hops.set(sourceId, 1);
    });

    filteredGraphData.links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;
      if (hops.get(sourceId) === 1 && !hops.has(targetId))
        hops.set(targetId, 2);
      if (hops.get(targetId) === 1 && !hops.has(sourceId))
        hops.set(sourceId, 2);
    });

    const nodes = filteredGraphData.nodes.filter((n) => hops.has(n.id));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = filteredGraphData.links.filter((l) => {
      const sourceId = typeof l.source === "object" ? l.source.id : l.source;
      const targetId = typeof l.target === "object" ? l.target.id : l.target;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    return { nodes, links };
  }, [filteredGraphData, clickedNode]);

  const SYNOLOGY_URL = import.meta.env.VITE_SYNOLOGY_URL
    ? import.meta.env.VITE_SYNOLOGY_URL.replace(/\/$/, "")
    : `${window.location.protocol}//${window.location.hostname}:5001`;

  const getThumbnailUrl = (id, cacheKey) => {
    let url = `${SYNOLOGY_URL}/synofoto/api/v2/p/Thumbnail/get?id=${id}&cache_key=${id}_${cacheKey}&type=unit&size=${thumbnailSize}`;
    if (authData.synotoken) url += `&SynoToken=${authData.synotoken}`;
    if (authData.sid) url += `&_sid=${authData.sid}`;
    return url;
  };

  const getOriginalUrl = (id, cacheKey) => {
    let url = `${SYNOLOGY_URL}/webapi/entry.cgi?cache_key=${id}_${cacheKey}&unit_id=[${id}]&api=SYNO.Foto.Download&method=download&version=2`;
    if (authData.synotoken) url += `&SynoToken=${authData.synotoken}`;
    if (authData.sid) url += `&_sid=${authData.sid}`;
    return url;
  };

  const handleImageError = (e) => {
    const img = e.target;
    let retries = parseInt(img.dataset.retries || "0", 10);
    if (retries < 5) {
      setTimeout(() => {
        img.dataset.retries = retries + 1;
        const originalSrc = img.src.split("#retry=")[0];
        img.src = `${originalSrc}#retry=${Date.now()}`;
      }, 2000);
    }
  };

  const handleLogout = () => {
    resetFilters();
    handleAuthLogout();
  };

  // --- Conditional Rendering (Must be AFTER all hooks) ---

  if (isCheckingAuth) return <div className="loading">{t("loading")}</div>;

  if (!authData.sid || !authData.synotoken) {
    return (
      <LoginForm
        language={language}
        changeLanguage={changeLanguage}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        handleLogin={handleLogin}
        t={t}
      />
    );
  }

  if (loading) return <div className="loading">{t("loading")}</div>;

  if (error) return <div className="error">{t("error", error)}</div>;

  return (
    <div className="app-container">
      <Sidebar viewMode={viewMode} setViewMode={setViewMode} t={t} />

      <AppHeader
        title="GraphStation"
        stats={{ nodes: graphData.nodes.length, links: graphData.links.length }}
        thumbnailSize={thumbnailSize}
        setThumbnailSize={setThumbnailSize}
        language={language}
        changeLanguage={changeLanguage}
        user={user}
        handleUserClick={handleUserClick}
        handleLogout={handleLogout}
        t={t}
      />

      <main className="content-area">
        {viewMode === "filter" && (
          <FilterView
            selectedFamily={selectedFamily}
            setSelectedFamily={setSelectedFamily}
            selectedPerson={selectedPerson}
            setSelectedPerson={setSelectedPerson}
            selectedCountry={selectedCountry}
             setSelectedCountry={setSelectedCountry}
             filters={filters}
             photos={photos}
             photosLoading={photosLoading}
             thumbnailSize={thumbnailSize}
             getThumbnailUrl={getThumbnailUrl}
             handleImageError={handleImageError}
             setSelectedPhoto={setSelectedPhoto}
             graphData={graphData}
             setClickedNode={setClickedNode}
             language={language}
             t={t}
             fetchMorePhotos={fetchMorePhotos}
             hasMore={hasMore}
             selectedYear={selectedYear}
             setSelectedYear={setSelectedYear}
           />
        )}

        {viewMode === "group" && (
          <GroupView
            groupKey={groupKey}
            setGroupKey={setGroupKey}
            groupedPhotos={groupedPhotos}
            groupedLoading={groupedLoading}
            thumbnailSize={thumbnailSize}
            expandedGroups={expandedGroups}
            toggleGroup={toggleGroup}
            language={language}
            getThumbnailUrl={getThumbnailUrl}
            handleImageError={handleImageError}
            setSelectedPhoto={setSelectedPhoto}
            graphData={graphData}
            setClickedNode={setClickedNode}
            t={t}
          />
        )}

        {viewMode === "graph" && !selectedPhoto && (
          <GraphView
            displayGraphData={displayGraphData}
            windowSize={windowSize}
            clickedNode={clickedNode}
            setClickedNode={setClickedNode}
            setSelectedPhoto={setSelectedPhoto}
            handleCloseOverlay={handleCloseOverlay}
            t={t}
          />
        )}
      </main>

      {selectedPhoto && (
        <PhotoDetailsModal
          selectedPhoto={selectedPhoto}
          photoDetails={photoDetails}
          language={language}
          handleCloseOverlay={handleCloseOverlay}
          getOriginalUrl={getOriginalUrl}
          t={t}
        />
      )}
    </div >
  );
}

export default App;
