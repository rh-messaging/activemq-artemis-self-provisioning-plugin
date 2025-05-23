import {
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  FormGroup,
} from '@patternfly/react-core';
import { FC, useContext } from 'react';
import { useTranslation } from '@app/i18n/i18n';
import { Acceptor } from '@app/k8s/types';
import {
  BrokerCreationFormDispatch,
  BrokerCreationFormState,
} from '@app/reducers/reducer';
import {
  ArtemisReducerOperations712,
  getAcceptorFromCertManagerResourceTemplate,
  getCertManagerResourceTemplateFromAcceptor,
} from '@app/reducers/7.12/reducer';
import { ResourceTemplate } from '@app/k8s/types';
import { SelectIssuerDrawer } from '../../SelectIssuerDrawer/SelectIssuerDrawer';
import { ConfirmDeleteModal } from '../../ConfirmDeleteModal/ConfirmDeleteModal';
type ResourceTemplateProps = {
  resourceTemplate: ResourceTemplate;
};

const CertManagerPreset: FC<ResourceTemplateProps> = ({ resourceTemplate }) => {
  const { cr } = useContext(BrokerCreationFormState);
  const { t } = useTranslation();
  const dispatch = useContext(BrokerCreationFormDispatch);
  const acceptor = getAcceptorFromCertManagerResourceTemplate(
    cr,
    resourceTemplate,
  );
  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: t('Cert-Manager issuer & Ingress exposure'),
            id: 'nested-field-cert-manager-annotation-id' + acceptor.name,
          }}
          titleDescription={t('Configuration items for the preset')}
          actions={
            <ConfirmDeleteModal
              subject="preset"
              action={() =>
                dispatch({
                  operation:
                    ArtemisReducerOperations712.deletePEMGenerationForAcceptor,
                  payload: acceptor.name,
                })
              }
            />
          }
        />
      }
    >
      <FormGroup label={t('Issuer')} isRequired>
        <SelectIssuerDrawer
          selectedIssuer={
            resourceTemplate.annotations['cert-manager.io/issuer']
          }
          setSelectedIssuer={(issuer: string) => {
            dispatch({
              operation: ArtemisReducerOperations712.updateAnnotationIssuer,
              payload: {
                acceptorName: acceptor.name,
                newIssuer: issuer,
              },
            });
          }}
          clearIssuer={() => {
            dispatch({
              operation: ArtemisReducerOperations712.updateAnnotationIssuer,
              payload: {
                acceptorName: acceptor.name,
                newIssuer: '',
              },
            });
          }}
        />
      </FormGroup>
    </FormFieldGroupExpandable>
  );
};

type ListPresetsProps = {
  acceptor: Acceptor;
};

export const ListPresets: FC<ListPresetsProps> = ({ acceptor }) => {
  const { cr } = useContext(BrokerCreationFormState);
  const certManagerRt = getCertManagerResourceTemplateFromAcceptor(
    cr,
    acceptor,
  );
  if (!certManagerRt) {
    return <></>;
  }
  return (
    <>
      {certManagerRt && <CertManagerPreset resourceTemplate={certManagerRt} />}
    </>
  );
};
