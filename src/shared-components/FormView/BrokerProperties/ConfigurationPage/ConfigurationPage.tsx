import { useTranslation } from '@app/i18n/i18n';
import { FC, createContext } from 'react';
import { Form, Text } from '@patternfly/react-core';
import { AcceptorsConfigPage } from './AcceptorsConfigPage/AcceptorsConfigPage';
import { ConsoleConfigPage } from './ConsoleConfigPage/ConsoleConfigPage';
import { AccessControlPage } from './AccessControl/AccessControlPage';

export const enum ConfigType {
  connectors = 'connectors',
  acceptors = 'acceptors',
  console = 'console',
  rbac = 'rbac',
}

type BrokerConfigProps = {
  brokerId: number;
  target: any;
  isPerBrokerConfig: boolean;
};

export const ConfigTypeContext = createContext<ConfigType>(
  ConfigType.acceptors,
);

export const ConfigurationPage: FC<BrokerConfigProps> = ({
  brokerId,
  target,
  isPerBrokerConfig,
}) => {
  const { t } = useTranslation();
  if (isPerBrokerConfig) {
    return <Text>{t('Per Broker Config is disabled for now.')}</Text>;
  }

  const configType: ConfigType = target;

  if (target) {
    return (
      <Form isWidthLimited>
        <ConfigTypeContext.Provider value={configType}>
          {target === 'console' && <ConsoleConfigPage brokerId={brokerId} />}
          {target === 'rbac' && <AccessControlPage />}
          {['acceptors', 'connectors'].find((v) => v === target) && (
            <AcceptorsConfigPage brokerId={brokerId} />
          )}
        </ConfigTypeContext.Provider>
      </Form>
    );
  }
  return (
    <Text>
      {t('This is the broker configuration page. Select one item on the left')}
    </Text>
  );
};
