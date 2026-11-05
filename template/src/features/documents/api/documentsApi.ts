import { baseApi } from '@/services/api';

import type { DocumentFile } from '../types';

export const documentsApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Document'] })
  .injectEndpoints({
    endpoints: build => ({
      getDocuments: build.query<DocumentFile[], void>({
        query: () => '/documents',
        providesTags: result => [
          { type: 'Document' as const, id: 'LIST' },
          ...(result?.map(({ id }) => ({ type: 'Document' as const, id })) ??
            []),
        ],
      }),
      deleteDocument: build.mutation<void, string>({
        query: id => ({
          url: `/documents/${encodeURIComponent(id)}`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, id) => [
          { type: 'Document', id },
          { type: 'Document', id: 'LIST' },
        ],
      }),
    }),
  });

export const { useDeleteDocumentMutation, useGetDocumentsQuery } = documentsApi;
