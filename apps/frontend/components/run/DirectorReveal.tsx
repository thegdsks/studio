'use client';

import { useState } from 'react';
import { Play, Mail, Code, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Label, fadeUp, withReducedMotion, usePrefersReducedMotion } from '@studio/ui';
import { DirectorWordStream } from './DirectorWordStream.js';

export interface DirectorBriefingData {
  headline_metric:  string;
  money_quote:      string;
  voiceover_script: string;
  talking_points:   [string, string, string, string, string];
  next_actions:     [string, string, string];
}

interface DirectorRevealProps {
  briefing: DirectorBriefingData;
}

const NEXT_ACTION_ICONS = [Play, Mail, Code] as const;

function TalkingPointRow({ index, text }: { index: number; text: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <span className="font-mono text-mono-sm text-accent tabular-nums shrink-0 w-5 text-right">
        {index + 1}.
      </span>
      <p className="text-body-sm text-text leading-relaxed">{text}</p>
    </div>
  );
}

function NextActionCard({ text, index }: { text: string; index: number }) {
  const Icon = NEXT_ACTION_ICONS[index] ?? ChevronRight;
  return (
    <div className="flex items-start gap-3 bg-surface-sunken border border-border rounded-md p-3">
      <span className="mt-0.5 shrink-0 text-accent">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="text-body-sm text-text leading-relaxed">{text}</p>
    </div>
  );
}

export function DirectorReveal({ briefing }: DirectorRevealProps) {
  const prefersReduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(true);

  const sectionVariants = withReducedMotion(fadeUp, prefersReduced);

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="w-full flex flex-col gap-6"
    >
      {/* Headline metric */}
      <div className="flex flex-col gap-2">
        <Label>Executive briefing</Label>
        <h2 className="font-display text-display-lg text-text leading-tight tracking-tight">
          {briefing.headline_metric}
        </h2>
        <p className="font-display text-headline-md text-text-muted italic">
          {briefing.money_quote}
        </p>
      </div>

      {/* Voiceover script */}
      <Card tone="active" surface="lifted">
        <CardHeader>
          <Label>60-second voiceover</Label>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Play className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => {
              // Toggle off then on to retrigger the animation
              setPlaying(false);
              requestAnimationFrame(() => setPlaying(true));
            }}
            aria-label="Replay voiceover animation"
          >
            Play briefing
          </Button>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <DirectorWordStream
            text={briefing.voiceover_script}
            playing={playing}
            wordDelay={30}
            className="text-body-md text-text leading-relaxed"
          />
        </CardBody>
      </Card>

      {/* Talking points + Next actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Talking points */}
        <Card tone="resting">
          <CardHeader>
            <Label>Talking points</Label>
          </CardHeader>
          <CardBody className="px-4 py-2">
            {briefing.talking_points.map((point, idx) => (
              <TalkingPointRow key={idx} index={idx} text={point} />
            ))}
          </CardBody>
        </Card>

        {/* Next actions */}
        <Card tone="resting">
          <CardHeader>
            <Label>Tomorrow morning</Label>
          </CardHeader>
          <CardBody className="px-4 py-3 flex flex-col gap-2">
            {briefing.next_actions.map((action, idx) => (
              <NextActionCard key={idx} text={action} index={idx} />
            ))}
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}
