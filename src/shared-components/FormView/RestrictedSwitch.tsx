import { useTranslation } from '@app/i18n/i18n';
import {
  BrokerCreationFormDispatch,
  BrokerCreationFormState,
} from '@app/reducers/reducer';
import { ArtemisReducerOperationsRestricted } from '@app/reducers/restricted/reducer';
import {
  Button,
  InputGroup,
  Modal,
  ModalVariant,
  Switch,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { FC, useContext, useState } from 'react';

export const RestrictedSwitch: FC = () => {
  const { t } = useTranslation();
  const { cr } = useContext(BrokerCreationFormState);
  const dispatch = useContext(BrokerCreationFormDispatch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean>(false);

  const onChangeRestricted = (value: boolean) => {
    // Show confirmation modal before changing
    setPendingValue(value);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    dispatch({
      operation: ArtemisReducerOperationsRestricted.setIsRestrited,
      payload: pendingValue,
    });
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <InputGroup>
        <Switch
          id="restricted-mode"
          aria-label={t('Toggle restricted mode')}
          isChecked={cr?.spec?.restricted ? true : false}
          onChange={(_event, checked: boolean) => onChangeRestricted(checked)}
        />
      </InputGroup>

      <Modal
        variant={ModalVariant.small}
        title={t('Switch to/from restricted mode?')}
        titleIconVariant={ExclamationTriangleIcon}
        isOpen={isModalOpen}
        onClose={handleCancel}
        actions={[
          <Button key={t('confirm')} variant="danger" onClick={handleConfirm}>
            Continue
          </Button>,
          <Button key={t('cancel')} variant="link" onClick={handleCancel}>
            Cancel
          </Button>,
        ]}
      >
        {t(
          'Enabling/disabling the restricted mode will reinitialize your settings. All changes will be lost.',
        )}
      </Modal>
    </>
  );
};
