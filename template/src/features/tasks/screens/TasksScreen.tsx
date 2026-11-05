import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MainTabScreenProps } from '@/app/navigation/types';
import { EmptyState, ErrorState, LoadingState, Text } from '@/components';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { makeStyles, useTheme } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { TASKS_PAGE_SIZE, useGetTasksInfiniteQuery } from '../api/tasksApi';
import { FilterChip } from '../components/FilterChip';
import { TaskCard } from '../components/TaskCard';
import { statusLabel, TASK_STATUSES } from '../labels';
import type { DueFilter, Task, TaskFilters, TaskStatus } from '../types';

const DUE_FILTERS: Exclude<DueFilter, 'all'>[] = ['overdue', 'today', 'week'];

export function TasksScreen({ navigation }: MainTabScreenProps<'Tasks'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [due, setDue] = useState<DueFilter>('all');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const filters = useMemo<TaskFilters>(
    () => ({
      search: debouncedSearch,
      status,
      assignee: mineOnly ? 'me' : 'all',
      due,
    }),
    [debouncedSearch, status, mineOnly, due],
  );

  const {
    currentData,
    error,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGetTasksInfiniteQuery(filters);
  const { isRefreshing, refresh } = useRefreshByUser(refetch);

  const tasks = useMemo(
    () => currentData?.pages.flatMap(page => page.data) ?? [],
    [currentData],
  );
  const total = currentData?.pages[0]?.total ?? 0;

  const openTask = useCallback(
    (task: Task) =>
      navigation.navigate('TaskDetails', { id: task.id, title: task.title }),
    [navigation],
  );

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const dueLabels: Record<Exclude<DueFilter, 'all'>, string> = {
    overdue: t('tasks.dueOverdue'),
    today: t('tasks.dueToday'),
    week: t('tasks.dueThisWeek'),
  };

  let emptyComponent = (
    <View testID={testIDs.tasks.empty}>
      <EmptyState message={t('tasks.empty')} />
    </View>
  );
  if (error) {
    emptyComponent = (
      <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
    );
  }

  return (
    <View style={styles.root} testID={testIDs.tasks.screen}>
      <View style={styles.filters}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('tasks.searchPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={t('tasks.searchPlaceholder')}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={styles.search}
          testID={testIDs.tasks.searchInput}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <FilterChip
            label={t('tasks.statusAll')}
            selected={status === 'all'}
            onPress={() => setStatus('all')}
            testID={testIDs.tasks.statusFilter('all')}
          />
          {TASK_STATUSES.map(value => (
            <FilterChip
              key={value}
              label={statusLabel(value, t)}
              selected={status === value}
              onPress={() => setStatus(value)}
              testID={testIDs.tasks.statusFilter(value)}
            />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <FilterChip
            label={t('tasks.assignedToMe')}
            selected={mineOnly}
            onPress={() => setMineOnly(value => !value)}
            testID={testIDs.tasks.assignedToMeFilter}
          />
          {DUE_FILTERS.map(value => (
            <FilterChip
              key={value}
              label={dueLabels[value]}
              selected={due === value}
              // Tapping the selected due filter clears it.
              onPress={() =>
                setDue(current => (current === value ? 'all' : value))
              }
              testID={testIDs.tasks.dueFilter(value)}
            />
          ))}
        </ScrollView>
        {currentData ? (
          <Text variant="caption" tone="muted" testID={testIDs.tasks.count}>
            {t('tasks.count', { shown: tasks.length, total })}
          </Text>
        ) : null}
      </View>

      {/* The list mounts with the first page of the current filters, so it
          starts at the top whenever a filter changes. */}
      {!currentData && isFetching ? (
        <LoadingState />
      ) : (
        <FlatList
          testID={testIDs.tasks.list}
          style={styles.list}
          contentContainerStyle={styles.content}
          data={tasks}
          keyExtractor={task => task.id}
          renderItem={({ item }) => <TaskCard task={item} onPress={openTask} />}
          initialNumToRender={TASKS_PAGE_SIZE}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={emptyComponent}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={theme.colors.primary}
                testID={testIDs.tasks.loadingMore}
              />
            ) : undefined
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filters: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  search: {
    ...theme.typography.body,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  chips: {
    gap: theme.spacing.sm,
  },
  list: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
}));
