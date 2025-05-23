import { FC, useContext } from 'react';
import { ConfigType } from '../../ConfigurationPage';
import {
  BrokerCreationFormDispatch,
  BrokerCreationFormState,
} from '@app/reducers/reducer';
import {
  ArtemisReducerOperations712,
  getAcceptor,
} from '@app/reducers/7.12/reducer';
import {
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
} from '@patternfly/react-core';
import { AcceptorConfigPage } from './AcceptorConfigPage/AcceptorConfigPage';
import { PresetButton } from './PresetButton/PresetButton';
import { ConfirmDeleteModal } from './ConfirmDeleteModal/ConfirmDeleteModal';
import { ConfigRenamingModal } from './ConfigRenamingModal/ConfigRenamingModal';

export type AcceptorConfigSectionProps = {
  configType: ConfigType;
  configName: string;
};

export const AcceptorConfigSection: FC<AcceptorConfigSectionProps> = ({
  configType,
  configName,
}) => {
  const dispatch = useContext(BrokerCreationFormDispatch);
  const onDelete = () => {
    if (configType === ConfigType.acceptors) {
      dispatch({
        operation: ArtemisReducerOperations712.deleteAcceptor,
        payload: configName,
      });
    }
    if (configType === ConfigType.connectors) {
      dispatch({
        operation: ArtemisReducerOperations712.deleteConnector,
        payload: configName,
      });
    }
  };

  const { cr } = useContext(BrokerCreationFormState);
  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: configName,
            id: 'configName' + configName,
          }}
          titleDescription={configName + "'s details"}
          actions={
            <>
              {configType === ConfigType.acceptors && (
                <PresetButton acceptor={getAcceptor(cr, configName)} />
              )}
              <ConfigRenamingModal initName={configName} />
              <ConfirmDeleteModal
                subject={
                  configType === ConfigType.acceptors ? 'acceptor' : 'connector'
                }
                action={onDelete}
              />
            </>
          }
        />
      }
    >
      <AcceptorConfigPage configType={configType} configName={configName} />
    </FormFieldGroupExpandable>
  );
};
