import {
  JumpLinks,
  JumpLinksItem,
  Sidebar,
  SidebarContent,
  SidebarPanel,
} from '@patternfly/react-core';
import { CSSProperties, FC, useState } from 'react';
import {
  ConfigType,
  GetConfigurationPage,
} from './ConfigurationPage/ConfigurationPage';
import { useTranslation } from '@app/i18n/i18n';

export type BrokerIDProp = {
  brokerId: number;
  perBrokerProperties: boolean;
  crName: string;
  targetNs: string;
};

export type BrokerReplicasProp = {
  replicas: number;
  crName: string;
  targetNs: string;
};

export const BrokerProperties: FC<BrokerIDProp> = ({
  brokerId,
  perBrokerProperties,
}) => {
  const { t } = useTranslation();
  const [currentConfigItem, setCurrentConfigItem] = useState<ConfigType>(
    ConfigType.acceptors,
  );

  return (
    <Sidebar hasBorder>
      <SidebarPanel variant="sticky">
        <JumpLinks isVertical aria-label="Broker Config List">
          <JumpLinksItem
            onClick={() => setCurrentConfigItem(ConfigType.acceptors)}
            isActive={currentConfigItem === ConfigType.acceptors}
            style={
              {
                listStyle: 'none' /* reset to patternfly default value*/,
              } as CSSProperties
            }
          >
            {t('Acceptors')}
          </JumpLinksItem>
          <JumpLinksItem
            onClick={() => setCurrentConfigItem(ConfigType.connectors)}
            isActive={currentConfigItem === ConfigType.connectors}
            style={
              {
                listStyle: 'none' /* reset to patternfly default value*/,
              } as CSSProperties
            }
          >
            {t('Connectors')}
          </JumpLinksItem>
          <JumpLinksItem
            onClick={() => setCurrentConfigItem(ConfigType.console)}
            isActive={currentConfigItem === ConfigType.console}
            style={
              {
                listStyle: 'none' /* reset to patternfly default value*/,
              } as CSSProperties
            }
          >
            {t('Console')}
          </JumpLinksItem>
        </JumpLinks>
      </SidebarPanel>
      <SidebarContent hasPadding>
        <GetConfigurationPage
          target={currentConfigItem}
          isPerBrokerConfig={perBrokerProperties}
          brokerId={brokerId}
        />
      </SidebarContent>
    </Sidebar>
  );
};
