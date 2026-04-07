import React from 'react';
import styled from 'styled-components';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { SUPPORT_THEME } from '../defaults/support.theme';

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${SUPPORT_THEME.textSecondary};
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 1.25rem;
  &:hover {
    color: ${SUPPORT_THEME.onSurface};
  }
`;

const HeaderCard = styled.div.attrs({ className: 'card border' })`
  padding: 1.5rem;
  background: ${SUPPORT_THEME.surfaceContainerLowest};
  border-color: ${SUPPORT_THEME.surfaceContainer} !important;
  margin-bottom: 1.5rem;
`;

const GuideTypeChip = styled.span`
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: ${SUPPORT_THEME.surfaceContainer};
  color: ${SUPPORT_THEME.onSurfaceVariant};
  text-transform: capitalize;
`;

const ContentCard = styled.div.attrs({ className: 'card border' })`
  padding: 1.5rem;
  background: ${SUPPORT_THEME.surfaceContainerLowest};
  border-color: ${SUPPORT_THEME.surfaceContainer} !important;
`;

const EmptyContentCard = styled.div.attrs({ className: 'card border text-center' })`
  padding: 3rem 2rem;
  background: ${SUPPORT_THEME.surfaceContainerLowest};
  border-color: ${SUPPORT_THEME.surfaceContainer} !important;
`;

const SupportGuideDetail = ({ ui, guide, itemOnAction, ...props }) => {
  const emit = (action, payload = {}) => {
    if (!itemOnAction) return;
    itemOnAction({ action: `link-loom-support::${action}`, namespace: 'link-loom-support', payload });
  };

  const hasContent = guide?.body_markdown && guide.body_markdown.trim().length > 0;

  return (
    <div {...props}>
      <BackButton onClick={() => emit('guide-list')}>
        <ArrowBackIcon sx={{ fontSize: 16 }} />
        Back
      </BackButton>

      <HeaderCard>
        <h2 className="fw-bold mb-2" style={{ color: SUPPORT_THEME.onSurface }}>
          {guide?.title}
        </h2>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          {guide?.guide_type && (
            <GuideTypeChip>{guide.guide_type}</GuideTypeChip>
          )}
          {guide?.estimated_read_time && (
            <span
              className="d-inline-flex align-items-center gap-1"
              style={{ fontSize: '0.78rem', color: SUPPORT_THEME.textMuted }}
            >
              <AccessTimeIcon sx={{ fontSize: 14 }} />
              {guide.estimated_read_time} min read
            </span>
          )}
        </div>

        {guide?.summary && (
          <p className="mb-0" style={{ fontSize: '0.9rem', color: SUPPORT_THEME.textSecondary }}>
            {guide.summary}
          </p>
        )}
      </HeaderCard>

      {hasContent ? (
        <ContentCard>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              lineHeight: 1.7,
              color: SUPPORT_THEME.onSurface,
              margin: 0,
            }}
          >
            {guide.body_markdown}
          </pre>
        </ContentCard>
      ) : (
        <EmptyContentCard>
          <MenuBookOutlinedIcon sx={{ fontSize: 40, color: SUPPORT_THEME.outline, mb: 1 }} />
          <h5 className="fw-semibold mt-2 mb-1" style={{ color: SUPPORT_THEME.onSurface }}>
            Content coming soon
          </h5>
          <p className="mb-0" style={{ fontSize: '0.875rem', color: SUPPORT_THEME.textMuted }}>
            This guide is being prepared.
          </p>
        </EmptyContentCard>
      )}
    </div>
  );
};

export default SupportGuideDetail;
