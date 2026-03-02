import { useMemo } from 'react';
import CollapsibleSection from './CollapsibleSection';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttHeader,
  GanttTimeline,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttMarker,
} from '@/components/kibo-ui/gantt';
import { computeHoldPeriod } from '@/utils/taxbenefits/computeHoldPeriod';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface TimingGanttSectionProps {
  constructionDelayMonths: number;
  placedInServiceMonth: number;
  taxBenefitDelayMonths: number;
  exitMonth: number;
  ozEnabled: boolean;
}

// HDC theme colors for timing clocks
const CLOCKS = {
  oz:           { id: 'oz',           name: 'OZ Hold',       color: '#3E5D80' }, // hdc-san-juan
  construction: { id: 'construction', name: 'Construction',  color: '#BFB05E' }, // hdc-husk
  lihtc:        { id: 'lihtc',        name: 'LIHTC Credits', color: '#407F7F' }, // hdc-faded-jade
  delay:        { id: 'delay',        name: 'K-1 Delay',     color: '#BF7041' }, // hdc-brown-rust
  disposition:  { id: 'disposition',  name: 'Disposition',   color: '#734968' }, // hdc-strikemaster
};

const CLOCK_AVATARS: Record<string, { initials: string; bg: string; fg: string }> = {
  oz:           { initials: 'OZ', bg: 'bg-[#3E5D80]/15', fg: 'text-[#3E5D80]' },
  construction: { initials: 'C',  bg: 'bg-[#BFB05E]/15', fg: 'text-[#BFB05E]' },
  lihtc:        { initials: 'LC', bg: 'bg-[#407F7F]/15', fg: 'text-[#407F7F]' },
  delay:        { initials: 'K1', bg: 'bg-[#BF7041]/15', fg: 'text-[#BF7041]' },
  disposition:  { initials: 'EX', bg: 'bg-[#734968]/15', fg: 'text-[#734968]' },
};

const TimingGanttSection: React.FC<TimingGanttSectionProps> = ({
  constructionDelayMonths,
  placedInServiceMonth,
  taxBenefitDelayMonths,
  exitMonth,
  ozEnabled,
}) => {
  const { holdFromPIS, totalInvestmentYears, exitYear, delaySpilloverYears } = useMemo(
    () => computeHoldPeriod(placedInServiceMonth, constructionDelayMonths, taxBenefitDelayMonths),
    [placedInServiceMonth, constructionDelayMonths, taxBenefitDelayMonths]
  );

  const creditPeriodFromPIS = placedInServiceMonth > 1 ? 11 : 10;
  const prePISYears = Math.floor(constructionDelayMonths / 12);

  // Offset origin by 3 months so bars don't start at the very left edge.
  // Month 0 of the investment maps to April 2025 (3 months after Jan 2025 origin).
  const PAD_MONTHS = 3;
  const monthToDate = (monthOffset: number) => new Date(2025, monthOffset + PAD_MONTHS, 1);
  const monthEndDate = (monthOffset: number) => {
    const d = new Date(2025, monthOffset + PAD_MONTHS + 1, 0);
    return d;
  };

  // Build features (bars) for each clock
  const { features, groups, markers } = useMemo(() => {
    const feats: Array<{
      id: string;
      name: string;
      startAt: Date;
      endAt: Date;
      status: { id: string; name: string; color: string };
      group: { id: string; name: string };
    }> = [];

    const grps = [
      { id: 'clocks', name: 'Investment Timeline Clocks' },
    ];

    const mkrs: Array<{
      id: string;
      date: Date;
      label: string;
      className: string;
    }> = [];

    // Clock 1: OZ Hold (10 years = 120 months from Day 1)
    if (ozEnabled) {
      feats.push({
        id: 'oz-hold',
        name: `OZ Hold — 10 years (120 months)`,
        startAt: monthToDate(0),
        endAt: monthEndDate(119),
        status: CLOCKS.oz,
        group: grps[0],
      });
    }

    // Clock 2: Construction / PIS Gate
    if (constructionDelayMonths > 0) {
      feats.push({
        id: 'construction',
        name: `Construction — ${constructionDelayMonths} months`,
        startAt: monthToDate(0),
        endAt: monthEndDate(constructionDelayMonths - 1),
        status: CLOCKS.construction,
        group: grps[0],
      });
    }

    // Clock 3: LIHTC Credit Period
    const creditStartMonth = constructionDelayMonths;
    const creditMonths = creditPeriodFromPIS * 12;
    feats.push({
      id: 'lihtc',
      name: `LIHTC Credits — ${creditPeriodFromPIS} years (${creditMonths} months) from PIS`,
      startAt: monthToDate(creditStartMonth),
      endAt: monthEndDate(creditStartMonth + creditMonths - 1),
      status: CLOCKS.lihtc,
      group: grps[0],
    });

    // Clock 4: K-1 Delay
    if (taxBenefitDelayMonths > 0) {
      const delayStart = creditStartMonth + creditMonths;
      feats.push({
        id: 'delay',
        name: `K-1 Delay — ${taxBenefitDelayMonths} months`,
        startAt: monthToDate(delayStart),
        endAt: monthEndDate(delayStart + taxBenefitDelayMonths - 1),
        status: CLOCKS.delay,
        group: grps[0],
      });
    }

    // Disposition period (exit month within exit year)
    const dispoStartMonth = (exitYear - 1) * 12;
    feats.push({
      id: 'disposition',
      name: `Disposition — ${MONTH_NAMES[exitMonth - 1]} of Year ${exitYear}`,
      startAt: monthToDate(dispoStartMonth),
      endAt: monthEndDate(dispoStartMonth + exitMonth - 1),
      status: CLOCKS.disposition,
      group: grps[0],
    });

    // Markers for key events
    mkrs.push({
      id: 'pis-marker',
      date: monthToDate(constructionDelayMonths),
      label: `PIS (${MONTH_NAMES[placedInServiceMonth - 1]})`,
      className: 'bg-emerald-100 text-emerald-900',
    });

    mkrs.push({
      id: 'exit-marker',
      date: monthToDate((exitYear - 1) * 12 + exitMonth - 1),
      label: `Exit (Yr ${exitYear})`,
      className: 'bg-red-100 text-red-900',
    });

    if (ozEnabled) {
      mkrs.push({
        id: 'oz-qualified-marker',
        date: monthToDate(120),
        label: 'OZ Qualified (10yr)',
        className: 'bg-indigo-100 text-indigo-900',
      });
    }

    return { features: feats, groups: grps, markers: mkrs };
  }, [constructionDelayMonths, placedInServiceMonth, taxBenefitDelayMonths, exitMonth, exitYear, ozEnabled, creditPeriodFromPIS]);

  return (
    <CollapsibleSection title={`Timing Clock Gantt Chart — ${totalInvestmentYears} year timeline`} defaultExpanded={false}>
      {/* Summary strip */}
      <div className="flex flex-wrap gap-4 text-xs mb-3 px-1" style={{ color: '#6b7280' }}>
        <div><span className="font-medium text-gray-700">Construction:</span> {constructionDelayMonths} mo</div>
        <div><span className="font-medium text-gray-700">PIS Month:</span> {MONTH_NAMES[placedInServiceMonth - 1]}</div>
        <div><span className="font-medium text-gray-700">Credits:</span> {creditPeriodFromPIS} yr</div>
        <div><span className="font-medium text-gray-700">K-1 Delay:</span> {taxBenefitDelayMonths} mo</div>
        <div><span className="font-medium text-gray-700">Exit:</span> Year {exitYear} ({MONTH_NAMES[exitMonth - 1]})</div>
        {delaySpilloverYears > 0 && (
          <div><span className="font-medium text-orange-600">Delay Spillover:</span> +{delaySpilloverYears} yr</div>
        )}
        {ozEnabled && <div><span className="font-medium text-indigo-600">OZ:</span> Active</div>}
      </div>

      {/* Gantt Chart */}
      <div className="border rounded-lg overflow-hidden" style={{ height: features.length * 44 + 80 }}>
        <GanttProvider range="monthly" zoom={30} startYear={2025} endYear={2025 + totalInvestmentYears + 1}>
          <GanttSidebar>
            <GanttSidebarGroup key="clocks" name="">
              {features.map((feature) => (
                <GanttSidebarItem
                  key={feature.id}
                  feature={feature}
                  onSelectItem={() => {}}
                />
              ))}
            </GanttSidebarGroup>
          </GanttSidebar>
          <GanttTimeline>
            <GanttHeader />
            <GanttFeatureList>
              <GanttFeatureListGroup key="clocks">
                {features.map((feature) => {
                  const avatarKey = feature.id === 'oz-hold' ? 'oz' : feature.id;
                  const avatar = CLOCK_AVATARS[avatarKey];
                  const barColor = feature.status.color;
                  return (
                    <div className="flex [&_[data-slot=gantt-card]]:!bg-[var(--bar-color)] [&_[data-slot=gantt-card]]:text-white [&_[data-slot=gantt-card]]:border-white/20" key={feature.id} style={{ '--bar-color': barColor } as React.CSSProperties}>
                      <GanttFeatureItem {...feature}>
                        <p className="flex-1 truncate text-xs">{feature.name}</p>
                        {avatar && (
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className={`${avatar.bg} ${avatar.fg} text-[9px] font-bold`}>
                              {avatar.initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </GanttFeatureItem>
                    </div>
                  );
                })}
              </GanttFeatureListGroup>
            </GanttFeatureList>
            {markers.map((marker) => (
              <GanttMarker key={marker.id} {...marker} onRemove={() => {}} />
            ))}
          </GanttTimeline>
        </GanttProvider>
      </div>

      {/* Month-precise formula */}
      <div className="mt-2 px-1 text-xs" style={{ color: '#9ca3af' }}>
        <span className="font-medium">Month-precise:</span>{' '}
        {constructionDelayMonths} + ({creditPeriodFromPIS} x 12) + {taxBenefitDelayMonths} ={' '}
        {constructionDelayMonths + creditPeriodFromPIS * 12 + taxBenefitDelayMonths} months{' '}
        = ceil({constructionDelayMonths + creditPeriodFromPIS * 12 + taxBenefitDelayMonths}/12) + 1 dispo{' '}
        = <span className="font-medium text-gray-600">{totalInvestmentYears} years</span>
      </div>
    </CollapsibleSection>
  );
};

export default TimingGanttSection;
