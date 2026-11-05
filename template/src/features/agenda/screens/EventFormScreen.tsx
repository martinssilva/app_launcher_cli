import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import {
  Button,
  ErrorState,
  FormTextField,
  LoadingState,
  Screen,
  Text,
  useZodForm,
} from '@/components';
import { makeStyles } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';
import { todayString } from '@/utils/dates';

import {
  useCreateEventMutation,
  useDeleteEventMutation,
  useGetEventQuery,
  useUpdateEventMutation,
} from '../api/agendaApi';
import { DatePickerField } from '../components/DatePickerField';
import { createEventSchema } from '../schemas';

/** Creates an event, or edits/deletes one when `eventId` is given. */
export function EventFormScreen({
  navigation,
  route,
}: RootStackScreenProps<'EventForm'>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const eventId = route.params?.eventId;
  const {
    data: event,
    error: loadError,
    isLoading: isLoadingEvent,
    refetch,
  } = useGetEventQuery(eventId ?? skipToken);
  const [createEvent, createState] = useCreateEventMutation();
  const [updateEvent, updateState] = useUpdateEventMutation();
  const [deleteEvent, deleteState] = useDeleteEventMutation();
  const { control, handleSubmit, reset, setFocus } = useZodForm(
    createEventSchema,
    {
      defaultValues: {
        title: '',
        date: route.params?.date ?? todayString(),
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        description: '',
      },
    },
  );

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        description: event.description,
      });
    }
  }, [event, reset]);

  const onSubmit = handleSubmit(async values => {
    try {
      if (eventId) {
        await updateEvent({ id: eventId, ...values }).unwrap();
      } else {
        await createEvent(values).unwrap();
      }
      navigation.goBack();
    } catch {
      // Shown below through the mutation error.
    }
  });

  const confirmDelete = () => {
    if (!eventId) {
      return;
    }
    Alert.alert(
      t('agenda.deleteConfirmTitle'),
      t('agenda.deleteConfirmMessage'),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('actions.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(eventId).unwrap();
              navigation.goBack();
            } catch {
              // Shown below through the mutation error.
            }
          },
        },
      ],
    );
  };

  if (eventId && isLoadingEvent) {
    return <LoadingState />;
  }
  if (eventId && loadError) {
    return (
      <ErrorState message={getErrorMessage(loadError, t)} onRetry={refetch} />
    );
  }

  const mutationError =
    createState.error ?? updateState.error ?? deleteState.error;

  return (
    <Screen scroll testID={testIDs.eventForm.screen}>
      <FormTextField
        control={control}
        name="title"
        label={t('agenda.eventTitle')}
        placeholder={t('agenda.eventTitlePlaceholder')}
        returnKeyType="next"
        testID={testIDs.eventForm.titleInput}
      />
      <DatePickerField
        control={control}
        name="date"
        label={t('agenda.date')}
        testID={testIDs.eventForm.dateField}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <FormTextField
            control={control}
            name="startTime"
            label={t('agenda.startTime')}
            placeholder={t('agenda.timePlaceholder')}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            returnKeyType="next"
            onSubmitEditing={() => setFocus('endTime')}
            testID={testIDs.eventForm.startTimeInput}
          />
        </View>
        <View style={styles.flex}>
          <FormTextField
            control={control}
            name="endTime"
            label={t('agenda.endTime')}
            placeholder={t('agenda.timePlaceholder')}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            returnKeyType="next"
            onSubmitEditing={() => setFocus('location')}
            testID={testIDs.eventForm.endTimeInput}
          />
        </View>
      </View>
      <FormTextField
        control={control}
        name="location"
        label={t('agenda.location')}
        placeholder={t('agenda.locationPlaceholder')}
        returnKeyType="next"
        testID={testIDs.eventForm.locationInput}
      />
      <FormTextField
        control={control}
        name="description"
        label={t('agenda.description')}
        placeholder={t('agenda.descriptionPlaceholder')}
        multiline
        style={styles.multiline}
        testID={testIDs.eventForm.descriptionInput}
      />

      {mutationError ? (
        <Text
          tone="danger"
          align="center"
          testID={testIDs.eventForm.errorMessage}
        >
          {getErrorMessage(mutationError, t)}
        </Text>
      ) : null}

      <Button
        title={t('actions.save')}
        onPress={onSubmit}
        loading={createState.isLoading || updateState.isLoading}
        testID={testIDs.eventForm.saveButton}
      />
      {eventId ? (
        <Button
          title={t('agenda.deleteEvent')}
          variant="ghost"
          onPress={confirmDelete}
          loading={deleteState.isLoading}
          testID={testIDs.eventForm.deleteButton}
        />
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flex: {
    flex: 1,
  },
  multiline: {
    minHeight: 96,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top',
  },
}));
