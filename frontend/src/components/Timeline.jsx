import React, { useMemo } from "react";

function Timeline({ photos, onSelectYear, selectedYear, t }) {
  // Berechne die Verteilung der Fotos über die Jahre
  const timelineData = useMemo(() => {
    if (!photos || photos.length === 0) return [];

    const yearCounts = {};
    photos.forEach((photo) => {
      const year = new Date(photo.takentime * 1000).getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    // Sortiere Jahre absteigend
    return Object.keys(yearCounts)
      .map((year) => ({
        year: parseInt(year, 10),
        count: yearCounts[year],
      }))
      .sort((a, b) => b.year - a.year);
  }, [photos]);

  if (timelineData.length === 0) return null;

  return (
    <div className="timeline-container">
      <div className="timeline-title">{t("timeline")}</div>
      <div className="timeline-list">
        <button
          className={`timeline-item ${!selectedYear ? "active" : ""}`}
          onClick={() => onSelectYear(null)}
        >
          <span className="timeline-year">All</span>
          <span className="timeline-count">{photos.length}</span>
        </button>
        {timelineData.map((data) => (
          <button
            key={data.year}
            className={`timeline-item ${selectedYear === data.year ? "active" : ""}`}
            onClick={() => onSelectYear(data.year)}
          >
            <span className="timeline-year">{data.year}</span>
            <span className="timeline-count">{data.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Timeline;
