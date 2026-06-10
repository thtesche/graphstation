import React from "react";

function FilterView({
  selectedFamily,
  setSelectedFamily,
  selectedPerson,
  setSelectedPerson,
  selectedCountry,
  setSelectedCountry,
  filters,
  photos,
  photosLoading,
  thumbnailSize,
  getThumbnailUrl,
  handleImageError,
  setSelectedPhoto,
  graphData,
  setClickedNode,
  language,
  t,
}) {
  return (
    <div className="grid-container">
      <div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="filter-family">{t("family")}</label>
          <select
            id="filter-family"
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
          >
            <option value="">{t("allFamilies")}</option>
            {filters.families.map((fam) => (
              <option key={fam} value={fam}>
                {fam}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-person">{t("person")}</label>
          <select
            id="filter-person"
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
          >
            <option value="">{t("allPersons")}</option>
            {filters.persons.map((pers) => (
              <option key={pers} value={pers}>
                {pers}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-country">{t("country")}</label>
          <select
            id="filter-country"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            <option value="">{t("allCountries")}</option>
            {filters.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {(selectedFamily || selectedPerson || selectedCountry) && (
          <button
            className="clear-filters-btn"
            onClick={() => {
              setSelectedFamily("");
              setSelectedPerson("");
              setSelectedCountry("");
            }}
          >
            {t("resetFilters")}
          </button>
        )}
      </div>

      <div
        className={`photo-grid size-${thumbnailSize} ${photosLoading ? "loading-opacity" : ""}`}
      >
        {photos.length > 0 ? (
          photos.map((photo) => (
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
                {new Date(photo.takentime * 1000).toLocaleDateString(
                  language === "de" ? "de-DE" : "en-US",
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-photos">
            {photosLoading ? t("searchingPhotos") : t("noPhotos")}
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterView;
