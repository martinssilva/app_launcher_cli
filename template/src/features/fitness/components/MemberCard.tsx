import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, Text } from '@/components';
import { testIDs } from '@/utils/testIDs';

import type { Member } from '../types';
import { PendingBadge } from './PendingBadge';

interface MemberCardProps {
  member: Member;
  workoutCount: number;
  onPress: (member: Member) => void;
}

function MemberCardComponent({
  member,
  workoutCount,
  onPress,
}: MemberCardProps) {
  const { t } = useTranslation();
  return (
    <Card
      onPress={() => onPress(member)}
      accessibilityLabel={member.name}
      testID={testIDs.members.item(member.id)}
    >
      <Text variant="subtitle">{member.name}</Text>
      <Text tone="muted">
        {t(`goals.${member.goal}`)} ·{' '}
        {t('members.workoutCount', { count: workoutCount })}
      </Text>
      <PendingBadge
        entity="members"
        id={member.id}
        testID={testIDs.members.pendingBadge(member.id)}
      />
    </Card>
  );
}

export const MemberCard = memo(MemberCardComponent);
