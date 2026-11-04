import React from 'react';

import { renderWithProviders, screen, userEvent } from '@/test-utils';

import { Button } from '../Button';

describe('Button', () => {
  it('calls onPress', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await renderWithProviders(<Button title="Save" onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled and busy while loading', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await renderWithProviders(
      <Button title="Save" onPress={onPress} loading testID="save" />,
    );

    const button = screen.getByTestId('save');
    expect(button).toBeDisabled();
    expect(button).toBeBusy();
    await user.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
