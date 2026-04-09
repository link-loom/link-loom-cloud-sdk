import React from 'react';
import SupportCategoryGrid from './SupportCategoryGrid.component';
import { SUPPORT_THEME } from '../defaults/support.theme';
import BackButton from '../../shared/BackButton.component';

const SupportAllCategories = ({ ui, namespace, categories, context, itemOnAction, ...props }) => {
  const pageTitle = namespace?.presentation?.categories_title || 'All Support Categories';
  const pageSubtitle =
    namespace?.presentation?.hero_subtitle ||
    namespace?.subtitle ||
    'Browse all available support categories and start a case.';

  const emit = (action, payload = {}) => {
    if (!itemOnAction) return;
    itemOnAction({ action: `link-loom-support::${action}`, namespace: 'link-loom-support', payload });
  };

  return (
    <article className="card shadow" {...props}>
      <section className="card-body">
        <BackButton onClick={() => emit('back-to-hub')}>Back to Support Hub</BackButton>

        <header className="d-flex flex-row justify-content-between mb-3">
          <section>
            <h4 className="mt-0 mb-1">{pageTitle}</h4>
            <p className="text-muted font-14 mb-3">{pageSubtitle}</p>
          </section>
        </header>

        {!categories || categories.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 200 }}>
            <span style={{ fontSize: '0.875rem', color: SUPPORT_THEME.textMuted }}>No categories available</span>
          </div>
        ) : (
          <SupportCategoryGrid categories={categories} itemOnAction={itemOnAction} ui={ui} />
        )}
      </section>
    </article>
  );
};

export default SupportAllCategories;
