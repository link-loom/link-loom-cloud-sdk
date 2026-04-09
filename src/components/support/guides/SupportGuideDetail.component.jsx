import React from 'react';
import styled from 'styled-components';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { SUPPORT_THEME } from '../defaults/support.theme';
import BackButton from '../../shared/BackButton.component';

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


const SupportGuideDetail = ({ ui, guide, itemOnAction, ...props }) => {
  const emit = (action, payload = {}) => {
    if (!itemOnAction) return;
    itemOnAction({ action: `link-loom-support::${action}`, namespace: 'link-loom-support', payload });
  };

  const hasContent = guide?.body_markdown && guide.body_markdown.trim().length > 0;

  return (
    <article className="card shadow" {...props}>
      <section className="card-body">
        <BackButton onClick={() => emit('guide-list')}>Back to Support Hub</BackButton>

        <header className="d-flex flex-row justify-content-between mb-3">
          <section>
            <h4 className="mt-0 mb-1">{guide?.title}</h4>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              {guide?.guide_type && <GuideTypeChip>{guide.guide_type}</GuideTypeChip>}
              {guide?.estimated_read_time && (
                <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '0.78rem', color: SUPPORT_THEME.textMuted }}>
                  <AccessTimeIcon sx={{ fontSize: 14 }} />
                  {guide.estimated_read_time} min read
                </span>
              )}
            </div>
            {guide?.summary && (
              <p className="text-muted font-14 mb-3">{guide.summary}</p>
            )}
          </section>
        </header>

        <section className="content">
          {hasContent ? (
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.7, color: SUPPORT_THEME.onSurface, margin: 0 }}>
              {guide.body_markdown}
            </pre>
          ) : (
            <div className="text-center py-5">
              <MenuBookOutlinedIcon sx={{ fontSize: 40, color: SUPPORT_THEME.outline, mb: 1 }} />
              <h5 className="fw-semibold mt-2 mb-1" style={{ color: SUPPORT_THEME.onSurface }}>Content coming soon</h5>
              <p className="mb-0" style={{ fontSize: '0.875rem', color: SUPPORT_THEME.textMuted }}>This guide is being prepared.</p>
            </div>
          )}
        </section>
      </section>
    </article>
  );
};

export default SupportGuideDetail;
