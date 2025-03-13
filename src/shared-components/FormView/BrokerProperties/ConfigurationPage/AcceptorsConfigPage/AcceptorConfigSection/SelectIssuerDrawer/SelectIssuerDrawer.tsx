import { useTranslation } from '@app/i18n/i18n';
import { BrokerCreationFormState } from '@app/reducers/reducer';
import { CertIssuerModel, CertModel } from '@app/k8s/models';
import { IssuerResource } from '@app/k8s/types';
import {
  RedExclamationCircleIcon,
  k8sCreate,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  FormGroup,
  InputGroup,
  Spinner,
  TextInput,
  InputGroupItem,
  FormHelperText,
} from '@patternfly/react-core';
import {
  Select,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core/deprecated';
import { FC, useContext, useState } from 'react';

const createChainOftrust = async (
  name: string,
  namespace: string,
  ingressDomain: string,
) => {
  const rootIssuer = {
    apiVersion: 'cert-manager.io/v1',
    kind: 'Issuer',
    metadata: {
      name: name + '-root-issuer',
      namespace: namespace,
    },
    spec: {
      selfSigned: {},
    },
  };
  const issuerCa = {
    apiVersion: 'cert-manager.io/v1',
    kind: 'Certificate',
    metadata: {
      name: name + 'cert',
      namespace: namespace,
    },
    spec: {
      isCA: true,
      commonName: name,
      dnsNames: ['issuer.' + ingressDomain],
      secretName: name + '-cert-secret',
      privateKey: {
        algorithm: 'ECDSA',
        size: 256,
      },
      issuerRef: {
        name: rootIssuer.metadata.name,
        kind: 'Issuer',
      },
    },
  };
  const content = {
    apiVersion: 'cert-manager.io/v1',
    kind: 'Issuer',
    metadata: {
      name: name,
      namespace: namespace,
    },
    spec: {
      ca: {
        secretName: issuerCa.spec.secretName,
      },
    },
  };

  return await k8sCreate({ model: CertIssuerModel, data: rootIssuer }).then(
    async () => {
      return await k8sCreate({ model: CertModel, data: issuerCa }).then(
        async () => {
          return await k8sCreate({ model: CertIssuerModel, data: content });
        },
      );
    },
  );
};

type SelectIssuerDrawerProps = {
  selectedIssuer: string;
  setSelectedIssuer: (issuerName: string) => void;
  clearIssuer: () => void;
  disableCreation?: boolean;
  isClusterIssuer?: boolean;
};

export const SelectIssuerDrawer: FC<SelectIssuerDrawerProps> = ({
  selectedIssuer,
  setSelectedIssuer,
  clearIssuer,
  disableCreation,
  isClusterIssuer,
}) => {
  const { cr } = useContext(BrokerCreationFormState);
  const { t } = useTranslation();
  const [issuers, loaded, loadError] = useK8sWatchResource<IssuerResource[]>({
    groupVersionKind: {
      group: 'cert-manager.io',
      version: 'v1',
      kind: isClusterIssuer ? 'ClusterIssuer' : 'Issuer',
    },
    isList: true,
    namespace: isClusterIssuer ? '' : cr.metadata.namespace,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [alertIssuer, setAlertIssuer] = useState<Error>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newIssuer, setNewIssuer] = useState('');
  if (!loaded) {
    return <Spinner size="lg" />;
  }
  if (loadError) {
    return (
      <>
        {t('cant fetch issuers')}
        <RedExclamationCircleIcon />
      </>
    );
  }
  const options = issuers
    .filter((issuer) => issuer.spec?.ca !== undefined)
    .map((issuer) => (
      <SelectOption key={issuer.metadata.name} value={issuer.metadata.name} />
    ));

  const onSelect = (_event: any, selection: string, isPlaceholder: any) => {
    if (isPlaceholder) clearSelection();
    else {
      setSelectedIssuer(selection);
      setIsOpen(false);
    }
  };

  const clearSelection = () => {
    setAlertIssuer(undefined);
    clearIssuer();
    setIsOpen(false);
  };

  const filterMatchingOptions = (_: any, value: string) => {
    if (!value) {
      return options;
    }

    const input = new RegExp(value, 'i');
    return options.filter((child) => input.test(child.props.value));
  };

  const triggerChainOfTrustCreation = () => {
    setAlertIssuer(undefined);
    createChainOftrust(newIssuer, cr.metadata.namespace, cr.spec.ingressDomain)
      .then(() => {
        setIsExpanded(false);
        setSelectedIssuer(newIssuer);
      })
      .catch((reason) => {
        setAlertIssuer(reason);
      });
  };
  const titleId = 'typeahead-select-issuer';
  return (
    <>
      <Drawer
        isExpanded={isExpanded}
        position="right"
        onExpand={() => setIsExpanded(true)}
      >
        <DrawerContent
          panelContent={
            <DrawerPanelContent>
              <DrawerHead>
                <FormGroup label={t('Name of the issuer')} isRequired>
                  <FormHelperText>
                    {t(
                      'Clicking on create will trigger the creation of 3 elements, a root issuer, a certificate signed by the root issuer, and an issuer using the certificate. The name of the issuer will correspond to the later.',
                    )}
                  </FormHelperText>
                  <InputGroup>
                    <InputGroupItem isFill>
                      <TextInput
                        value={newIssuer}
                        onChange={(_event, v) => {
                          setAlertIssuer(undefined);
                          setNewIssuer(v);
                        }}
                      />
                    </InputGroupItem>
                    <InputGroupItem>
                      <Button onClick={triggerChainOfTrustCreation}>
                        {t('Create')}
                      </Button>
                    </InputGroupItem>
                  </InputGroup>
                </FormGroup>
                {alertIssuer && (
                  <Alert variant={AlertVariant.danger} title="Error">
                    {alertIssuer.message}
                  </Alert>
                )}
                <DrawerActions>
                  <DrawerCloseButton onClick={() => setIsExpanded(false)} />
                </DrawerActions>
              </DrawerHead>
            </DrawerPanelContent>
          }
        >
          <DrawerContentBody>
            <InputGroup>
              <InputGroupItem>
                <Select
                  variant={SelectVariant.typeahead}
                  typeAheadAriaLabel={
                    isClusterIssuer
                      ? t('Select a cluster issuer')
                      : t('Select an issuer')
                  }
                  onToggle={() => setIsOpen(!isOpen)}
                  onSelect={onSelect}
                  onClear={clearSelection}
                  onFilter={filterMatchingOptions}
                  selections={selectedIssuer}
                  isOpen={isOpen}
                  aria-labelledby={titleId}
                  placeholderText={
                    isClusterIssuer
                      ? t('Select a cluster issuer')
                      : t('Select an issuer')
                  }
                  menuAppendTo={() => document.body}
                >
                  {options}
                </Select>
              </InputGroupItem>
              {!disableCreation && (
                <InputGroupItem>
                  <Button
                    variant={ButtonVariant.primary}
                    onClick={() => setIsExpanded(true)}
                  >
                    {t('Create a new chain of trust')}
                  </Button>
                </InputGroupItem>
              )}
            </InputGroup>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
