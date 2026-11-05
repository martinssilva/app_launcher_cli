import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import { useCallback, useRef, useState } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { apiClient, type ApiErrorData, toApiError } from '@/services/api';

import { documentsApi } from '../api/documentsApi';
import type { DocumentFile, PickedFile } from '../types';

const UPLOAD_TIMEOUT_MS = 120_000;

export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string; progress: number }
  | { status: 'error'; fileName: string; error: ApiErrorData };

/**
 * Picks a file with the system document picker and uploads it to
 * `POST /documents` (multipart, field `file`) with progress.
 *
 * Uploads go through `apiClient` directly instead of an RTK Query mutation
 * because `onUploadProgress` is a callback (not serializable state).
 */
export function useDocumentUpload() {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const lastFile = useRef<PickedFile | null>(null);

  const upload = useCallback(
    async (file: PickedFile): Promise<boolean> => {
      lastFile.current = file;
      setState({ status: 'uploading', fileName: file.name, progress: 0 });

      const body = new FormData();
      // React Native's FormData reads the file from `uri` (file:// or content://).
      body.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);

      try {
        await apiClient.post<DocumentFile>('/documents', body, {
          // Without this, axios would serialize the FormData as JSON
          // because the client's default Content-Type is application/json.
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: UPLOAD_TIMEOUT_MS,
          onUploadProgress: event => {
            const progress = event.total
              ? event.loaded / event.total
              : (event.progress ?? 0);
            setState(current =>
              current.status === 'uploading'
                ? { ...current, progress }
                : current,
            );
          },
        });
        dispatch(
          documentsApi.util.invalidateTags([{ type: 'Document', id: 'LIST' }]),
        );
        setState({ status: 'idle' });
        return true;
      } catch (error) {
        setState({
          status: 'error',
          fileName: file.name,
          error: toApiError(error).toJSON(),
        });
        return false;
      }
    },
    [dispatch],
  );

  const pickAndUpload = useCallback(async (): Promise<boolean> => {
    try {
      const [picked] = await pick({ type: [types.allFiles] });
      return upload({
        uri: picked.uri,
        name: picked.name ?? 'document',
        type: picked.type ?? 'application/octet-stream',
      });
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return false;
      }
      setState({
        status: 'error',
        fileName: '',
        error: toApiError(error).toJSON(),
      });
      return false;
    }
  }, [upload]);

  const retry = useCallback(
    () =>
      lastFile.current ? upload(lastFile.current) : Promise.resolve(false),
    [upload],
  );

  const dismissError = useCallback(() => setState({ status: 'idle' }), []);

  return { state, pickAndUpload, retry, dismissError };
}
