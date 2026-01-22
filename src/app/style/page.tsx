'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { PageHeader } from '@/components/ui/PageHeader';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { Icon } from '@/components/ui/Icon';
import styles from './style.module.css';

export default function StyleGuidePage() {
  const [toggleStates, setToggleStates] = useState({
    toggle1: false,
    toggle2: true,
    toggle3: false,
    toggle4: true,
  });

  return (
    <div className={styles.container}>
      <PageHeader title="Style Guide" size="lg" />

      <div className={styles.content}>
        {/* Buttons Section */}
        <section className={styles.section}>
          <SectionTitle>Buttons</SectionTitle>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Variants</h3>
            <div className={styles.row}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Sizes</h3>
            <div className={styles.row}>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>With Icons</h3>
            <div className={styles.row}>
              <Button variant="primary" leftIcon={<Icon name="plus" size="sm" />}>Add New</Button>
              <Button variant="secondary" rightIcon={<Icon name="chevron-right" size="sm" />}>Next</Button>
              <Button variant="ghost" leftIcon={<Icon name="copy" size="sm" />}>Copy</Button>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>States</h3>
            <div className={styles.row}>
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="secondary" disabled>Disabled</Button>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Full Width</h3>
            <div className={styles.column}>
              <Button variant="primary" fullWidth>Full Width Primary</Button>
              <Button variant="secondary" fullWidth>Full Width Secondary</Button>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className={styles.section}>
          <SectionTitle>Typography</SectionTitle>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Font Sizes</h3>
            <div className={styles.column}>
              <p className={styles.textXl}>Extra Large (20px) - Page titles</p>
              <p className={styles.textLg}>Large (18px) - Section headers</p>
              <p className={styles.textMd}>Medium (16px) - Body text</p>
              <p className={styles.textSm}>Small (14px) - Labels, captions</p>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Font Weights</h3>
            <div className={styles.column}>
              <p className={styles.weightRegular}>Regular (400)</p>
              <p className={styles.weightMedium}>Medium (500)</p>
              <p className={styles.weightSemibold}>Semibold (600)</p>
              <p className={styles.weightBold}>Bold (700)</p>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Content Colors</h3>
            <div className={styles.column}>
              <p className={styles.textPrimary}>Primary - Main content text</p>
              <p className={styles.textSecondary}>Secondary - Supporting text</p>
              <p className={styles.textTertiary}>Tertiary - Muted text</p>
              <p className={styles.textError}>Error - Error messages</p>
              <p className={styles.textSuccess}>Success - Success messages</p>
              <p className={styles.textWarning}>Warning - Warning messages</p>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className={styles.section}>
          <SectionTitle>Badges</SectionTitle>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Count Badges</h3>
            <div className={styles.row}>
              <Badge variant="default" count={5} />
              <Badge variant="success" count={12} />
              <Badge variant="warning" count={3} />
              <Badge variant="error" count={99} />
              <Badge variant="accent" count={42} />
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Badge Sizes</h3>
            <div className={styles.row}>
              <Badge variant="error" count={5} size="sm" />
              <Badge variant="error" count={5} size="md" />
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Dot Badges</h3>
            <div className={styles.row}>
              <Badge variant="default" dot />
              <Badge variant="success" dot />
              <Badge variant="warning" dot />
              <Badge variant="error" dot />
              <Badge variant="accent" dot />
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Max Count</h3>
            <div className={styles.row}>
              <Badge variant="error" count={150} maxCount={99} />
              <Badge variant="error" count={1000} maxCount={999} />
            </div>
          </div>
        </section>

        {/* Ethos Reputation Badges Section */}
        <section className={styles.section}>
          <SectionTitle>Ethos Reputation Badges</SectionTitle>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>All Levels (Full Variant)</h3>
            <div className={styles.column}>
              <ReputationBadge score={500} level="untrusted" variant="full" />
              <ReputationBadge score={800} level="questionable" variant="full" />
              <ReputationBadge score={1100} level="neutral" variant="full" />
              <ReputationBadge score={1250} level="known" variant="full" />
              <ReputationBadge score={1400} level="established" variant="full" />
              <ReputationBadge score={1550} level="reputable" variant="full" />
              <ReputationBadge score={1700} level="exemplary" variant="full" />
              <ReputationBadge score={1850} level="distinguished" variant="full" />
              <ReputationBadge score={2000} level="revered" variant="full" />
              <ReputationBadge score={2200} level="renowned" variant="full" />
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Compact Variant</h3>
            <div className={styles.row}>
              <ReputationBadge score={1550} level="reputable" variant="compact" />
              <ReputationBadge score={1700} level="exemplary" variant="compact" />
              <ReputationBadge score={500} level="untrusted" variant="compact" />
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Score Only Variant</h3>
            <div className={styles.row}>
              <ReputationBadge score={1550} level="reputable" variant="score-only" />
              <ReputationBadge score={1700} level="exemplary" variant="score-only" />
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Sizes</h3>
            <div className={styles.column}>
              <ReputationBadge score={1550} level="reputable" size="sm" variant="full" />
              <ReputationBadge score={1550} level="reputable" size="md" variant="full" />
              <ReputationBadge score={1550} level="reputable" size="lg" variant="full" />
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Unverified</h3>
            <div className={styles.row}>
              <ReputationBadge verified={false} />
              <ReputationBadge score={null} level={null} />
            </div>
          </div>
        </section>

        {/* Toggles Section */}
        <section className={styles.section}>
          <SectionTitle>Toggles</SectionTitle>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>States</h3>
            <div className={styles.row}>
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Off</span>
                <Toggle
                  checked={toggleStates.toggle1}
                  onChange={(checked) => setToggleStates(s => ({ ...s, toggle1: checked }))}
                />
              </div>
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>On</span>
                <Toggle
                  checked={toggleStates.toggle2}
                  onChange={(checked) => setToggleStates(s => ({ ...s, toggle2: checked }))}
                />
              </div>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Sizes</h3>
            <div className={styles.row}>
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Small</span>
                <Toggle
                  checked={toggleStates.toggle3}
                  onChange={(checked) => setToggleStates(s => ({ ...s, toggle3: checked }))}
                  size="sm"
                />
              </div>
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Medium</span>
                <Toggle
                  checked={toggleStates.toggle4}
                  onChange={(checked) => setToggleStates(s => ({ ...s, toggle4: checked }))}
                  size="md"
                />
              </div>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Disabled</h3>
            <div className={styles.row}>
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Disabled Off</span>
                <Toggle checked={false} onChange={() => {}} disabled />
              </div>
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Disabled On</span>
                <Toggle checked={true} onChange={() => {}} disabled />
              </div>
            </div>
          </div>
        </section>

        {/* Titles Section */}
        <section className={styles.section}>
          <SectionTitle>Titles</SectionTitle>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Page Headers</h3>
            <div className={styles.column}>
              <div className={styles.headerDemo}>
                <PageHeader title="Small Header" size="sm" />
              </div>
              <div className={styles.headerDemo}>
                <PageHeader title="Medium Header" subtitle="With subtitle" size="md" />
              </div>
              <div className={styles.headerDemo}>
                <PageHeader title="Large Header" size="lg" />
              </div>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Section Titles</h3>
            <div className={styles.column}>
              <SectionTitle>Section Title Example</SectionTitle>
              <SectionTitle>Another Section</SectionTitle>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
