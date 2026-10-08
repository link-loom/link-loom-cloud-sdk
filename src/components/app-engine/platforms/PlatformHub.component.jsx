import React from "react";
import { Card, CardContent } from "@mui/material";
import { OpenInNew as PortalIcon, SupportAgent as SupportIcon } from "@mui/icons-material";
import { QuickLinkCard } from "@link-loom/react-sdk";

import { mergeDefaults } from "../defaults/appEngine.defaults";
import { PLATFORM_ICON_BASE_PATH, platformIconSrc, platformLabels } from "../defaults/stoneos-platforms.catalog";
import { PLATFORM_HUB_LABELS } from "./platform-hub.labels";

const CARD_CLASS = "d-flex col-12 col-sm-6 col-md-4 col-lg-4 col-xl-3 mb-3";
const ICON_BACKGROUND = 0.15;

// A QuickLinkCard that goes nowhere yet: same card, no link and no arrow.
function ComingSoonCard({ title, description, logoSrc }) {
  return (
    <article className={CARD_CLASS}>
      <Card className="border-0 shadow-sm h-100 flex-fill" sx={{ borderRadius: "30px", opacity: 0.7 }}>
        <CardContent sx={{ padding: "30px" }}>
          <header className="mb-2">
            <img src={logoSrc} alt="" width={40} height={40} className="rounded-3" />
            <h6 className="fw-bold mt-3 mb-1">{title}</h6>
            <p className="text-muted mb-0">{description}</p>
          </header>
        </CardContent>
      </Card>
    </article>
  );
}

/**
 * The page a StoneOS host shows for one platform of the ecosystem: the capability it gives the
 * organization as the title, a card per section the host has built for it (`sections`, each
 * `{ to, title, description, Icon }`), the platform's help center and a card to its own portal. A
 * platform with no sections yet says its StoneOS app will open here instead of leaving the page bare.
 *
 * `platform` is an entry of `STONEOS_PLATFORMS`; `supportPath` is where the host mounted the support
 * center; `iconBasePath` is where the host serves the platform logos.
 */
function PlatformHub({
  platform,
  locale = "en",
  sections = [],
  supportPath,
  iconBasePath = PLATFORM_ICON_BASE_PATH,
  labels,
}) {
  if (!platform) {
    return null;
  }

  const copy = mergeDefaults(PLATFORM_HUB_LABELS[locale] || PLATFORM_HUB_LABELS.en, labels);
  const { capability, name, description } = platformLabels(platform, locale);
  const hasSections = sections.length > 0;

  return (
    <section className="container-fluid my-4 px-4">
      <section className="row">
        <header className="col-12">
          <h4 className="mb-2 mt-1">{capability}</h4>
          <p className="text-muted mb-3">{description}</p>
        </header>

        {sections.map((section) => (
          <QuickLinkCard
            key={section.to}
            href={section.to}
            title={section.title}
            description={section.description}
            Icon={section.Icon}
            iconColor={platform.color}
            backgroundPercentage={ICON_BACKGROUND}
            className={CARD_CLASS}
          />
        ))}

        {!hasSections && (
          <ComingSoonCard
            title={copy.comingSoon.title}
            description={copy.comingSoon.description(capability)}
            logoSrc={platformIconSrc(platform, iconBasePath)}
          />
        )}

        {supportPath && (
          <QuickLinkCard
            href={supportPath}
            title={copy.helpCenter.title}
            description={copy.helpCenter.description(name)}
            Icon={SupportIcon}
            iconColor={platform.color}
            backgroundPercentage={ICON_BACKGROUND}
            className={CARD_CLASS}
          />
        )}

        <QuickLinkCard
          href={platform.portalUrl}
          title={copy.portal.title(name)}
          description={copy.portal.description(name)}
          Icon={PortalIcon}
          iconColor={platform.color}
          backgroundPercentage={ICON_BACKGROUND}
          className={CARD_CLASS}
        />
      </section>
    </section>
  );
}

export default PlatformHub;
