import { FC, useReducer } from 'react';
import {
  BrokerCreationFormDispatch,
  BrokerCreationFormState,
  artemisCrReducer,
  newArtemisCR,
} from '@app/reducers/reducer';
import { fireEvent, render, screen, waitFor } from '@app/test-utils';
import { RestrictedSwitch } from './RestrictedSwitch';

const SimplifiedRestrictedSwitchPage: FC = () => {
  const initialValues = newArtemisCR('default');
  const [brokerModel, dispatch] = useReducer(artemisCrReducer, initialValues);
  return (
    <BrokerCreationFormState.Provider value={brokerModel}>
      <BrokerCreationFormDispatch.Provider value={dispatch}>
        <RestrictedSwitch />
      </BrokerCreationFormDispatch.Provider>
    </BrokerCreationFormState.Provider>
  );
};

describe('RestrictedSwitch', () => {
  it('should render the switch in unchecked state by default', () => {
    render(<SimplifiedRestrictedSwitchPage />);
    const restrictedSwitch = document.querySelector(
      '#restricted-mode',
    ) as HTMLInputElement;
    expect(restrictedSwitch).toBeInTheDocument();
    expect(restrictedSwitch).not.toBeChecked();
  });

  it('should show confirmation modal when clicking the switch', async () => {
    render(<SimplifiedRestrictedSwitchPage />);
    const restrictedSwitch = document.querySelector(
      '#restricted-mode',
    ) as HTMLInputElement;

    // Click the switch to enable restricted mode
    fireEvent.click(restrictedSwitch);

    // Wait for the modal to appear
    await waitFor(() => {
      expect(
        screen.getByText(/Switch to\/from restricted mode?/i),
      ).toBeInTheDocument();
    });

    // Check that the modal has the warning message
    expect(
      screen.getByText(
        /Enabling\/disabling the restricted mode will reinitialize your settings/i,
      ),
    ).toBeInTheDocument();
  });

  it('should enable restricted mode when confirming in the modal', async () => {
    render(<SimplifiedRestrictedSwitchPage />);
    const restrictedSwitch = document.querySelector(
      '#restricted-mode',
    ) as HTMLInputElement;

    // Initially not checked
    expect(restrictedSwitch).not.toBeChecked();

    // Click the switch
    fireEvent.click(restrictedSwitch);

    // Wait for modal and click Continue button
    await waitFor(() => {
      expect(
        screen.getByText(/Switch to\/from restricted mode?/i),
      ).toBeInTheDocument();
    });

    const continueButton = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueButton);

    // Wait for the modal to close and the switch to be checked
    await waitFor(() => {
      expect(
        screen.queryByText(/Switch to\/from restricted mode?/i),
      ).not.toBeInTheDocument();
    });

    // After confirmation, the switch should be checked
    expect(restrictedSwitch).toBeChecked();
  });

  it('should not change state when canceling the modal', async () => {
    render(<SimplifiedRestrictedSwitchPage />);
    const restrictedSwitch = document.querySelector(
      '#restricted-mode',
    ) as HTMLInputElement;

    // Initially not checked
    expect(restrictedSwitch).not.toBeChecked();

    // Click the switch
    fireEvent.click(restrictedSwitch);

    // Wait for modal and click Cancel button
    await waitFor(() => {
      expect(
        screen.getByText(/Switch to\/from restricted mode?/i),
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    // Wait for the modal to close
    await waitFor(() => {
      expect(
        screen.queryByText(/Switch to\/from restricted mode?/i),
      ).not.toBeInTheDocument();
    });

    // After canceling, the switch should still be unchecked
    expect(restrictedSwitch).not.toBeChecked();
  });

  it('should toggle between restricted and non-restricted modes', async () => {
    render(<SimplifiedRestrictedSwitchPage />);
    const restrictedSwitch = document.querySelector(
      '#restricted-mode',
    ) as HTMLInputElement;

    // Enable restricted mode
    fireEvent.click(restrictedSwitch);
    await waitFor(() => {
      expect(
        screen.getByText(/Switch to\/from restricted mode?/i),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => {
      expect(restrictedSwitch).toBeChecked();
    });

    // Disable restricted mode
    fireEvent.click(restrictedSwitch);
    await waitFor(() => {
      expect(
        screen.getByText(/Switch to\/from restricted mode?/i),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => {
      expect(restrictedSwitch).not.toBeChecked();
    });
  });
});
