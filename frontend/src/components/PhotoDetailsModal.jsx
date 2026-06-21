import React from "react";

function PhotoDetailsModal({
  selectedPhoto,
  photoDetails,
  language,
  handleCloseOverlay,
  getOriginalUrl,
  t,
}) {
  return (
    <div className="overlay-modal" onClick={handleCloseOverlay}>
      <button className="overlay-close" onClick={handleCloseOverlay}>
        ✕
      </button>

      <div
        className="overlay-left-pane"
        style={{
          flex: "0 0 66.666%",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overlay-image-container">
          <img
            className="overlay-image"
            src={getOriginalUrl(selectedPhoto.id, selectedPhoto.cache_key)}
            alt="NAS Original Photo"
          />
        </div>

        <div className="overlay-metadata">
          {selectedPhoto.takentime && (
            <div style={{ marginBottom: 0 }}>
              📅{" "}
              {new Date(selectedPhoto.takentime * 1000).toLocaleString(
                language === "de" ? "de-DE" : "en-US",
              )}
            </div>
          )}
        </div>
      </div>

      {photoDetails ? (
        <div
          className="overlay-right-pane"
          data-testid="modal-graph-container"
          onClick={(e) => e.stopPropagation()}
          style={{ overflowY: "auto", padding: "1.5rem" }}
        >
          <h2
            className="detail-title"
            style={{ marginTop: 0, marginBottom: "1.5rem" }}
          >
            {t("photoDetails")}
          </h2>

          {/* Families Section */}
          {photoDetails.families && photoDetails.families.length > 0 && (
            <div className="family-details">
              {photoDetails.families.map((family) => {
                const familyName =
                  typeof family === "string" ? family : family?.name;
                const members = family?.members || [];
                return (
                  <div key={familyName} className="family-container">
                    <h4 className="family-name">{familyName}</h4>
                    <div className="person-chips">
                      {members.map((member) => {
                        const inPhoto =
                          photoDetails.persons_in_photo?.includes(member);
                        return (
                          <span
                            key={member}
                            className={`person-chip ${inPhoto ? "in-photo" : ""}`}
                            title={
                              inPhoto
                                ? "Person im Bild"
                                : "Familienmitglied (nicht im Bild)"
                            }
                          >
                            {member}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Other Persons (not in any family) */}
          {(() => {
            const familyMembers = new Set(
              photoDetails.families?.flatMap((f) => f?.members || []) || [],
            );
            const otherPersons =
              photoDetails.persons_in_photo?.filter(
                (p) => !familyMembers.has(p),
              ) || [];

            if (otherPersons.length === 0) return null;

            return (
              <div className="family-container" style={{ marginTop: "1.5rem" }}>
                <h4 className="family-name">{t("person")}</h4>
                <div className="person-chips">
                  {otherPersons.map((person) => (
                    <span
                      key={person}
                      className="person-chip in-photo"
                      title="Person im Bild"
                    >
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Countries / Locations Section */}
          {photoDetails.countries && photoDetails.countries.length > 0 && (
            <div className="family-container" style={{ marginTop: "1.5rem" }}>
              <h4 className="family-name">{t("location")}</h4>
              <div className="person-chips">
                {photoDetails.countries.map((country) => (
                  <span
                    key={country}
                    className="person-chip"
                    style={{ cursor: "default" }}
                  >
                    📍 {country}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="overlay-right-pane"
          data-testid="modal-graph-container"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div className="loading">{t("loading")}</div>
        </div>
      )}
    </div>
  );
}

export default PhotoDetailsModal;
