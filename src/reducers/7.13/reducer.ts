import { ArtemisReducerActions712, reducer712 } from '../7.12/reducer';
import { FormState713 } from './import-types';

// Operations for 7.13 start at number 2000
export enum ArtemisReducerOperations713 {
  isUsingToken = 2000,
  setServiceAccount,
  setJaasExtraConfig,
}

export type ReducerActionBase = {
  operation: ArtemisReducerOperations713;
};

interface IsUsingTokenAction extends ReducerActionBase {
  operation: ArtemisReducerOperations713.isUsingToken;
  /** set to true for token auth, false for username password*/
  payload: boolean;
}

interface SetServiceAccountAction extends ReducerActionBase {
  operation: ArtemisReducerOperations713.setServiceAccount;
  /** set the service account for the broker*/
  payload: string;
}

interface SetJaasExtraConfigAction extends ReducerActionBase {
  operation: ArtemisReducerOperations713.setJaasExtraConfig;
  /** The name of the secret for the jass login module*/
  payload: string;
}

// 7.13 is 7.12 + extras
export type ArtemisReducerActions713 =
  | ArtemisReducerActions712
  | IsUsingTokenAction
  | SetJaasExtraConfigAction
  | SetServiceAccountAction;

export const reducer713: React.Reducer<
  FormState713,
  ArtemisReducerActions713
> = (prevFormState, action) => {
  const formState = { ...prevFormState };

  switch (action.operation) {
    case ArtemisReducerOperations713.isUsingToken:
      if (action.payload) {
        delete formState.cr.spec.adminPassword;
        delete formState.cr.spec.adminUser;
      } else {
        formState.cr.spec.adminPassword = 'admin';
        formState.cr.spec.adminUser = 'admin';
        delete formState.cr.spec.deploymentPlan.extraMounts;
        delete formState.cr.spec.deploymentPlan.podSecurity;
      }
      return formState;
    case ArtemisReducerOperations713.setJaasExtraConfig:
      if (!action.payload) {
        delete formState.cr.spec.deploymentPlan.extraMounts;
      } else {
        formState.cr.spec.deploymentPlan.extraMounts = {
          secrets: [action.payload],
        };
      }
      return formState;
    case ArtemisReducerOperations713.setServiceAccount:
      if (!action.payload) {
        delete formState.cr.spec.deploymentPlan.podSecurity;
      } else {
        formState.cr.spec.deploymentPlan.podSecurity = {
          serviceAccountName: action.payload,
        };
      }
      return formState;
    default:
      return reducer712(
        formState,
        action as ArtemisReducerActions712,
      ) as FormState713;
  }
};

export const areMandatoryValuesSet713 = (formState: FormState713) => {
  // if the user wants to configure the token review and has not set the
  // required data, return false.
  if (formState.cr.spec.adminUser === undefined) {
    if (!formState.cr?.spec?.deploymentPlan?.extraMounts?.secrets[0]) {
      return false;
    }
    if (!formState.cr?.spec?.deploymentPlan?.podSecurity?.serviceAccountName) {
      return false;
    }
  }
  return true;
};
