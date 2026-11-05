import { pick } from '@react-native-documents/picker';
import { Alert, Linking } from 'react-native';

import { renderSignedInApp } from '@/test-utils/session';
import { screen, userEvent, waitFor } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

const mockedPick = jest.mocked(pick);

async function openDocuments() {
  const user = userEvent.setup();
  await renderSignedInApp();
  await user.press(await screen.findByTestId(testIDs.officeTabs.documents));
  expect(await screen.findByText('Company handbook.pdf')).toBeOnTheScreen();
  return user;
}

describe('documents', () => {
  it('uploads the picked file', async () => {
    const user = await openDocuments();

    await user.press(screen.getByTestId(testIDs.documents.uploadButton));

    // Default picker mock (jest/setup.js) returns report.pdf.
    expect(await screen.findByText('report.pdf')).toBeOnTheScreen();
    expect(
      screen.queryByTestId(testIDs.documents.uploadError),
    ).not.toBeOnTheScreen();
  });

  it('does nothing when the picker is cancelled', async () => {
    mockedPick.mockRejectedValueOnce(
      Object.assign(new Error('cancelled'), { code: 'OPERATION_CANCELED' }),
    );
    const user = await openDocuments();

    await user.press(screen.getByTestId(testIDs.documents.uploadButton));

    await waitFor(() => expect(mockedPick).toHaveBeenCalled());
    expect(
      screen.queryByTestId(testIDs.documents.uploadError),
    ).not.toBeOnTheScreen();
  });

  it('shows an error when the upload is rejected', async () => {
    mockedPick.mockResolvedValueOnce([
      {
        uri: 'file:///mock/setup.exe',
        name: 'setup.exe',
        type: 'application/octet-stream',
        nativeType: null,
        size: 10,
        error: null,
        isVirtual: false,
        convertibleToMimeTypes: null,
        hasRequestedType: true,
      },
    ]);
    const user = await openDocuments();

    await user.press(screen.getByTestId(testIDs.documents.uploadButton));

    expect(
      await screen.findByTestId(testIDs.documents.uploadError),
    ).toHaveTextContent("Couldn't upload setup.exe.", { exact: false });
    expect(screen.getByTestId(testIDs.documents.retryButton)).toBeOnTheScreen();
  });

  it('opens and deletes a document', async () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) => {
        buttons?.find(button => button.style === 'destructive')?.onPress?.();
      });
    const user = await openDocuments();

    await user.press(screen.getByTestId(testIDs.documents.item('d1')));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://files.example.com/d1/Company%20handbook.pdf',
    );

    await user.press(screen.getByTestId(testIDs.documents.deleteButton('d1')));
    await waitFor(() =>
      expect(screen.queryByText('Company handbook.pdf')).not.toBeOnTheScreen(),
    );
  });
});
