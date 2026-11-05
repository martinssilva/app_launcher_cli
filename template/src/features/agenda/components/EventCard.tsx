import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, Text } from '@/components';
import { testIDs } from '@/utils/testIDs';

import type { CalendarEvent } from '../types';

interface EventCardProps {
  event: CalendarEvent;
  onPress: (event: CalendarEvent) => void;
}

function EventCardComponent({ event, onPress }: EventCardProps) {
  const { t } = useTranslation();
  return (
    <Card
      onPress={() => onPress(event)}
      accessibilityLabel={event.title}
      testID={testIDs.agenda.event(event.id)}
    >
      <Text variant="label" tone="primary">
        {t('agenda.timeRange', { start: event.startTime, end: event.endTime })}
      </Text>
      <Text variant="subtitle">{event.title}</Text>
      {event.location ? <Text tone="muted">{event.location}</Text> : null}
    </Card>
  );
}

export const EventCard = memo(EventCardComponent);
