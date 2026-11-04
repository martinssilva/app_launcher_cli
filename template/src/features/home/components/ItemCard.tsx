import React, { memo } from 'react';

import { Card, Text } from '@/components';
import { testIDs } from '@/utils/testIDs';

import type { Item } from '../types';

interface ItemCardProps {
  item: Item;
  onPress: (item: Item) => void;
}

function ItemCardComponent({ item, onPress }: ItemCardProps) {
  return (
    <Card
      onPress={() => onPress(item)}
      testID={testIDs.home.item(item.id)}
      accessibilityLabel={item.title}
    >
      <Text variant="subtitle">{item.title}</Text>
      <Text tone="muted" numberOfLines={2}>
        {item.description}
      </Text>
    </Card>
  );
}

export const ItemCard = memo(ItemCardComponent);
