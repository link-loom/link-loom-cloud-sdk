import React from "react";
import styled from "styled-components";
import AppStoreGridCardComponent from "./AppStoreGridCard.component";
import AppStoreEmptyStateComponent from "./AppStoreEmptyState.component";

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 16px 20px;
`;

const SkeletonCard = styled.div`
  height: 200px;
  border-radius: 16px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SkeletonBlock = styled.div`
  border-radius: ${({ $radius }) => $radius || "6px"};
  background-color: #f3f4f6;
  animation: marketplace-card-pulse 1.5s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay || "0ms"};
`;

function AppStoreGridComponent({
  apps,
  selectedAppId,
  focusedIndex,
  indexOffset = 0,
  onSelect,
  onOpenApp,
  onEditApp,
  onPinApp,
  onFavoriteApp,
  onDeleteApp,
  searchTerm,
  loading,
  selectedCategory,
  onClearFilters,
  onCreateApp,
  getCategoryIcon,
  sectionLabel,
  userOrganizationId,
}) {
  if (loading) {
    return (
      <div>
        <GridContainer>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonCard key={i}>
              <div className="d-flex align-items-center gap-3">
                <SkeletonBlock $delay={`${i * 80}ms`} $radius="14px" style={{ width: 48, height: 48, flexShrink: 0 }} />
                <div className="flex-grow-1">
                  <SkeletonBlock $delay={`${i * 80}ms`} style={{ width: "60%", height: 14, marginBottom: 6 }} />
                  <SkeletonBlock $delay={`${i * 80}ms`} style={{ width: "40%", height: 10 }} />
                </div>
              </div>
              <SkeletonBlock $delay={`${i * 80}ms`} style={{ width: "100%", height: 12 }} />
              <SkeletonBlock $delay={`${i * 80}ms`} style={{ width: "75%", height: 12 }} />
              <div className="mt-auto d-flex justify-content-between">
                <SkeletonBlock $delay={`${i * 80}ms`} $radius="999px" style={{ width: 80, height: 22 }} />
                <SkeletonBlock $delay={`${i * 80}ms`} $radius="999px" style={{ width: 60, height: 22 }} />
              </div>
            </SkeletonCard>
          ))}
        </GridContainer>
        <style>{`@keyframes marketplace-card-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    );
  }

  if (!apps || apps.length === 0) {
    return (
      <div>
        <AppStoreEmptyStateComponent
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          onClearFilters={onClearFilters}
          onCreateApp={onCreateApp}
        />
      </div>
    );
  }

  return (
    <div>
      {sectionLabel && (
        <div style={{ padding: "16px 20px 0 20px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#9CA3AF", letterSpacing: "0.5px" }}>
            {sectionLabel}
          </span>
        </div>
      )}
      <GridContainer>
        {apps.map((app, index) => (
          <AppStoreGridCardComponent
            key={app.id}
            app={app}
            isSelected={selectedAppId === app.id || focusedIndex === (indexOffset + index)}
            onSelect={onSelect}
            onOpenApp={onOpenApp}
            onEditApp={onEditApp}
            onPinApp={onPinApp}
            onFavoriteApp={onFavoriteApp}
            onDeleteApp={onDeleteApp}
            searchTerm={searchTerm}
            getCategoryIcon={getCategoryIcon}
            userOrganizationId={userOrganizationId}
          />
        ))}
      </GridContainer>
    </div>
  );
}

export default AppStoreGridComponent;
