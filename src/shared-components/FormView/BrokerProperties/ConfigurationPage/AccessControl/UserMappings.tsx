import { useTranslation } from '@app/i18n/i18n';
import {
  BrokerCreationFormDispatch,
  BrokerCreationFormState,
} from '@app/reducers/reducer';
import { SecretModel } from '@app/k8s/models';
import { ConfigMapSecretResource } from '@app/k8s/types';
import {
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
  Popover,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  Tooltip,
} from '@patternfly/react-core';
import {
  Select,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core/deprecated';
import { FC, useContext, useState } from 'react';
import {
  ArtemisReducerOperations713,
  getInitSecurityRoles,
} from '@app/reducers/7.13/reducer';
import { HelpIcon } from '@patternfly/react-icons';
import styles from '@patternfly/react-styles/css/components/Form/form';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

const createJaasConfig = async (
  name: string,
  adminName: string,
  namespace: string,
) => {
  const secretName = name + '-jaas-config';
  const secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: secretName,
      namespace: namespace,
    },
    stringData: {
      'login.config':
        'token {\n' +
        '  org.apache.activemq.artemis.spi.core.security.jaas.KubernetesLoginModule sufficient\n' +
        '   reload=true\n' +
        '   debug=true\n' +
        '   org.apache.activemq.jaas.kubernetes.role="k8s-users-to-roles-mapping.properties"\n' +
        '   baseDir="/amq/extra/secrets/' +
        secretName +
        '/";\n\n' +
        '  org.apache.activemq.artemis.spi.core.security.jaas.PropertiesLoginModule sufficient\n' +
        '   reload=true\n' +
        '   debug=true\n' +
        '   org.apache.activemq.jaas.properties.user="artemis-users.properties"\n' +
        '   org.apache.activemq.jaas.properties.role="artemis-roles.properties"\n' +
        '   baseDir="/home/jboss/amq-broker/etc";\n\n' +
        '  };\n\n' +
        'activemq {\n' +
        '  org.apache.activemq.artemis.spi.core.security.jaas.PropertiesLoginModule sufficient\n' +
        '   reload=true\n' +
        '   debug=true\n' +
        '   org.apache.activemq.jaas.properties.user="extra-users.properties"\n' +
        '   org.apache.activemq.jaas.properties.role="extra-roles.properties";\n' +
        '  };\n',
      'k8s-users-to-roles-mapping.properties': 'admin=' + adminName,
      'extra-roles.properties': 'queue_users=' + adminName,
      'extra-users.properties': adminName + '=' + adminName,
    },
  };
  return await k8sCreate({ model: SecretModel, data: secret });
};

export const SelectUserMappings: FC = () => {
  const { t } = useTranslation();
  const { cr } = useContext(BrokerCreationFormState);
  const dispatch = useContext(BrokerCreationFormDispatch);
  const [secrets, loaded, loadError] = useK8sWatchResource<
    ConfigMapSecretResource[]
  >({
    groupVersionKind: {
      version: 'v1',
      kind: 'Secret',
    },
    isList: true,
    namespace: cr.metadata.namespace,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [alertSecret, setAlertSecret] = useState<Error>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newJaasConfigName, setNewJaasConfigName] = useState('');
  const [newJaasConfigAdmin, setNewJaasConfigAdmin] = useState('');

  const [needsInitializingSR, setNeedsInitializingSR] =
    useState<boolean>(false);
  if (!loaded) {
    return <Spinner size="lg" />;
  }
  if (loadError) {
    return (
      <Alert variant={AlertVariant.danger} title={t('cant fetch jaas configs')}>
        error
      </Alert>
    );
  }
  const validSecrets = secrets.filter(
    (secret) =>
      (secret.metadata?.name
        ? secret.metadata.name.includes('-jaas-config')
        : false) &&
      secret.data?.['login.config'] !== undefined &&
      secret.data?.['k8s-users-to-roles-mapping.properties'] !== undefined &&
      secret.data?.['extra-roles.properties'] !== undefined &&
      secret.data?.['extra-users.properties'] !== undefined,
  );
  const options = validSecrets.map((jaasConfig) => (
    <SelectOption
      key={jaasConfig.metadata.name}
      value={jaasConfig.metadata.name}
    />
  ));

  const selectedSecret =
    cr.spec?.deploymentPlan?.extraMounts?.secrets[0] !== undefined
      ? validSecrets.filter(
          (secret) =>
            secret.metadata?.name ===
            cr.spec.deploymentPlan.extraMounts.secrets[0],
        )[0]
      : undefined;

  // if the user just selected a jaas config, override the previous security
  // roles
  if (needsInitializingSR && selectedSecret?.data['extra-roles.properties']) {
    setNeedsInitializingSR(false);
    dispatch({
      operation: ArtemisReducerOperations713.setSecurityRoles,
      payload: getInitSecurityRoles(
        atob(selectedSecret.data['extra-roles.properties']).split('\n'),
      ),
    });
  }

  const onSelect = (_event: any, selection: string, isPlaceholder: any) => {
    if (isPlaceholder) {
      clearSelection();
      // clear the associated security roles
      dispatch({
        operation: ArtemisReducerOperations713.setSecurityRoles,
        payload: new Map(),
      });
    } else {
      dispatch({
        operation: ArtemisReducerOperations713.setJaasExtraConfig,
        payload: selection,
      });
      setIsOpen(false);
      setNeedsInitializingSR(true);
    }
  };

  const clearSelection = () => {
    setAlertSecret(undefined);
    dispatch({
      operation: ArtemisReducerOperations713.setJaasExtraConfig,
      payload: undefined,
    });
    setIsOpen(false);
  };

  const filterMatchingOptions = (_: any, value: string) => {
    if (!value) {
      return options;
    }

    const input = new RegExp(value, 'i');
    return options.filter((child) => input.test(child.props.value));
  };

  const triggerJaasConfigCreation = () => {
    setAlertSecret(undefined);
    createJaasConfig(
      newJaasConfigName,
      newJaasConfigAdmin,
      cr.metadata.namespace,
    )
      .then(() => {
        setIsExpanded(false);
        dispatch({
          operation: ArtemisReducerOperations713.setJaasExtraConfig,
          payload: newJaasConfigName + '-jaas-config',
        });
        setNeedsInitializingSR(true);
      })
      .catch((reason) => {
        setAlertSecret(reason);
      });
  };
  const titleId = 'typeahead-select-jaas-config';
  return (
    <FormGroup
      label={t('Jaas login module')}
      labelIcon={
        <Popover
          headerContent={
            <div>
              {t('Select a secret configuring a KubernetesLoginModule')}
            </div>
          }
          bodyContent={
            <div>
              {t(
                'The selected secret must be within the same namespace as the broker you want to deploy. You can also create one on the fly.',
              )}{' '}
            </div>
          }
        >
          <button
            type="button"
            aria-label="More info for name field"
            onClick={(e) => e.preventDefault()}
            aria-describedby="form-group-label-info"
            className={styles.formGroupLabelHelp}
          >
            <HelpIcon />
          </button>
        </Popover>
      }
      isRequired
    >
      <Drawer
        isExpanded={isExpanded}
        position="right"
        onExpand={() => setIsExpanded(true)}
      >
        <DrawerContent
          panelContent={
            <DrawerPanelContent>
              <DrawerHead>
                <FormGroup label={t('Jaas config name')} isRequired>
                  <InputGroupItem isFill>
                    <TextInput
                      value={newJaasConfigName}
                      onChange={(_event, v) => {
                        setAlertSecret(undefined);
                        setNewJaasConfigName(v);
                      }}
                    />
                  </InputGroupItem>
                </FormGroup>
                <br />
                <FormGroup label={t("Admin's username")} isRequired>
                  <InputGroupItem isFill>
                    <TextInput
                      value={newJaasConfigAdmin}
                      onChange={(_event, v) => {
                        setAlertSecret(undefined);
                        setNewJaasConfigAdmin(v);
                      }}
                    />
                  </InputGroupItem>
                </FormGroup>
                <FormHelperText>
                  {t(
                    'This custom jaas config will allow the user specified as administrator to access the jolokia endpoint of the broker.',
                  )}
                </FormHelperText>
                <Button onClick={triggerJaasConfigCreation}>
                  {t('Create the jaas config')}
                </Button>
                {alertSecret && (
                  <Alert variant={AlertVariant.danger} title="Error">
                    {alertSecret.message}
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
                  typeAheadAriaLabel={t('Select a jaas config')}
                  onToggle={() => setIsOpen(!isOpen)}
                  onSelect={onSelect}
                  onClear={clearSelection}
                  onFilter={filterMatchingOptions}
                  selections={cr.spec?.deploymentPlan?.extraMounts?.secrets[0]}
                  isOpen={isOpen}
                  aria-labelledby={titleId}
                  placeholderText={t('Select a jaas config')}
                  menuAppendTo={() => document.body}
                >
                  {options}
                </Select>
              </InputGroupItem>
              <InputGroupItem>
                {selectedSecret ? (
                  <>
                    <Tooltip
                      content={t(
                        'If during your editing of the jaas-config you changed the roles, you can rebuild the security roles in order to take into account your changes',
                      )}
                    >
                      <Button
                        variant="primary"
                        onClick={() =>
                          window.open(
                            'ns/' +
                              selectedSecret.metadata.namespace +
                              '/secrets/' +
                              selectedSecret.metadata.name +
                              '/edit',
                          )
                        }
                      >
                        {t('edit')}
                      </Button>
                    </Tooltip>

                    <Tooltip
                      content={t(
                        'Rebuilding the security roles will override the ones that are already configured.',
                      )}
                    >
                      <Button
                        variant="link"
                        onClick={() =>
                          dispatch({
                            operation:
                              ArtemisReducerOperations713.setSecurityRoles,
                            payload: getInitSecurityRoles(
                              atob(
                                selectedSecret.data['extra-roles.properties'],
                              ).split('\n'),
                            ),
                          })
                        }
                      >
                        {t('rebuild security roles')}
                      </Button>
                    </Tooltip>
                  </>
                ) : (
                  <Button
                    variant={ButtonVariant.primary}
                    onClick={() => setIsExpanded(true)}
                  >
                    {t('Create a new jaas config')}
                  </Button>
                )}
              </InputGroupItem>
            </InputGroup>
            {selectedSecret !== undefined && (
              <FormFieldGroupExpandable
                header={
                  <FormFieldGroupHeader
                    titleText={{
                      text: t('Details'),
                      id: 'jaasconfigdetails',
                    }}
                    titleDescription={t(
                      "Show the jaas-config's roles and users",
                    )}
                  />
                }
              >
                <br />
                <DescriptionList aria-label="details-selected-jaas-config">
                  <DescriptionListGroup>
                    <DescriptionListTerm>
                      {t(
                        'Openshift users allowed to read the jolokia endpoint',
                      )}
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      <Table>
                        <Thead noWrap>
                          <Tr>
                            <Th> {t('Group')} </Th>
                            <Th>
                              {t('OpenShift usernames (comma separated)')}
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {atob(
                            selectedSecret.data[
                              'k8s-users-to-roles-mapping.properties'
                            ],
                          )
                            .split('\n')
                            .filter((line) => line.match('.+=.+'))
                            .map((line, index) => {
                              return (
                                <Tr key={index}>
                                  <Td> {line.split('=')[0]} </Td>
                                  <Td> {line.split('=')[1]} </Td>
                                </Tr>
                              );
                            })}
                        </Tbody>
                      </Table>
                      {}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>
                      {t('Users allowed to access the broker')}
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      <Table>
                        <Thead noWrap>
                          <Tr>
                            <Th> {t('Username')} </Th>
                            <Th>{t('Password')}</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {atob(selectedSecret.data['extra-users.properties'])
                            .split('\n')
                            .filter((line) => line.match('.+=.+'))
                            .map((line, index) => {
                              return (
                                <Tr key={index}>
                                  <Td> {line.split('=')[0]} </Td>
                                  <Td> {line.split('=')[1]} </Td>
                                </Tr>
                              );
                            })}
                        </Tbody>
                      </Table>
                      {}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>
                      {t('Roles used for security rules')}
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      <Table>
                        <Thead noWrap>
                          <Tr>
                            <Th> {t('Role')} </Th>
                            <Th>{t('Users (comma separated)')}</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {atob(selectedSecret.data['extra-roles.properties'])
                            .split('\n')
                            .filter((line) => line.match('.+=.+'))
                            .map((line, index) => {
                              return (
                                <Tr key={index}>
                                  <Td> {line.split('=')[0]} </Td>
                                  <Td> {line.split('=')[1]} </Td>
                                </Tr>
                              );
                            })}
                        </Tbody>
                      </Table>
                      {}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </FormFieldGroupExpandable>
            )}
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </FormGroup>
  );
};
