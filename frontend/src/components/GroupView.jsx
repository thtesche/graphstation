import React from "react";

function GroupView({
  groupKey,
  setGroupKey,
  groupedPhotos,
  groupedLoading,
  thumbnailSize,
  expandedGroups,
  toggleGroup,
  language,
  getThumbnailUrl,
  handleImageError,
  setSelectedPhoto,
  graphData,
  setClickedNode,
  t,
}) {
  return (
    <div className="group-container">
      <div className="group-header">
        <div className="group-chips">
          <button
            className={`group-chip ${groupKey === "family" ? "active" : ""}`}
            onClick={() => setGroupKey("family")}
          >
            👪 {t("family")}
          </button>
          <button
            className={`group-chip ${groupKey === "person" ? "active" : ""}`}
            onClick={() => setGroupKey("person")}
          >
            👤 {t("person")}
          </button>
          <button
            className={`group-chip ${groupKey === "location" ? "active" : ""}`}
            onClick={() => setGroupKey("location")}
          >
            📍 {t("location")}
          </button>
        </div>
      </div>

      <div
        className={`grouped-content ${groupedLoading ? "loading-opacity" : ""}`}
      >
        {groupedPhotos.length > 0 ? (
          groupedPhotos.map((group) => {
            const getRowLimit = (size) => {
              if (size === "sm") return 10;
              if (size === "m") return 6;
              return 4; // 'xl'
            };
            const getDomLimit = (size) => {
              if (size === "sm") return 35;
              if (size === "m") return 20;
              return 10; // 'xl'
            };
            const buttonThreshold = getRowLimit(thumbnailSize);
            const domLimit = getDomLimit(thumbnailSize);
            const isExpanded = expandedGroups[group.group_name];
            const hasMoreThanOneRow = group.photos.length > buttonThreshold;
            const visiblePhotos = isExpanded
              ? group.photos
              : group.photos.slice(0, domLimit);

            // Calculate youngest and oldest photo years
            const years = group.photos
              .map((p) => p.takentime)
              .filter((t) => typeof t === "number" && t > 0)
              .map((t) => new Date(t * 1000).getFullYear());

            let groupMeta = "";
            if (years.length > 0) {
              const maxYear = Math.max(...years);
              const minYear = Math.min(...years);
              const yearRange =
                maxYear === minYear ? `${maxYear}` : `${maxYear}-${minYear}`;
              groupMeta = `(${yearRange})`;
            }

            return (
              <div key={group.group_name} className="group-section">
                <div className="group-section-header">
                  <h2 className="group-section-title">
                    {groupKey === "family" && "👪 "}
                    {groupKey === "person" && "👤 "}
                    {groupKey === "location" && "📍 "}
                    {group.group_name}{" "}
                    {groupMeta && (
                      <span className="group-count">{groupMeta}</span>
                    )}
                  </h2>
                  {hasMoreThanOneRow ? (
                    <button
                      className="group-expand-btn"
                      onClick={() => toggleGroup(group.group_name)}
                    >
                      {isExpanded
                        ? t("collapse")
                        : t("showAll", group.photos.length)}
                    </button>
                  ) : (
                    <span className="group-info-badge">
                      {t("imagesCount", group.photos.length)}
                    </span>
                  )}
                </div>
                <div
                  className={`photo-grid size-${thumbnailSize} ${!isExpanded ? "collapsed" : ""}`}
                >
                  {visiblePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="photo-card"
                      onClick={() => {
                        setSelectedPhoto(photo);
                        const node = graphData?.nodes?.find(
                          (n) => n.unit_id === photo.id,
                        );
                        if (node) setClickedNode(node);
                      }}
                    >
                      <img
                        src={getThumbnailUrl(photo.id, photo.cache_key)}
                        alt="NAS Photo"
                        loading="lazy"
                        onError={handleImageError}
                      />
                      <div className="photo-date">
                        {photo.takentime
                          ? new Date(photo.takentime * 1000).toLocaleDateString(
                              language === "de" ? "de-DE" : "en-US",
                            )
                          : t("unknown")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-photos">
            {groupedLoading ? t("groupingPhotos") : t("noGroupedPhotos")}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupView;
