import { reducer712, ArtemisReducerActions712 } from '../7.12/reducer';
import { FormState713 } from './import-types';

// Operations for 7.13 start at number 2000
export enum ArtemisReducerOperations713 {
  isUsingToken = 2000,
  setServiceAccount,
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

// 7.13 is 7.12 + extras
export type ArtemisReducerActions713 =
  | ArtemisReducerActions712
  | IsUsingTokenAction
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
