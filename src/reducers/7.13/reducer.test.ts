import {
  ArtemisReducerGlobalOperations,
  artemisCrReducer,
  newArtemisCR,
} from '../reducer';
import { ArtemisReducerOperations713, reducer713 } from './reducer';

describe('test the creation broker reducer', () => {
  it('test enabling auth via token', () => {
    const initialState = newArtemisCR('namespace');
    const newState = reducer713(initialState, {
      operation: ArtemisReducerOperations713.isUsingToken,
      payload: true,
    });
    expect(newState.cr.spec.adminUser).toBe(undefined);
    const newState2 = reducer713(newState, {
      operation: ArtemisReducerOperations713.isUsingToken,
      payload: false,
    });
    expect(newState2.cr.spec.adminUser).toBe('admin');
    expect(newState2.cr.spec.deploymentPlan.extraMounts).toBe(undefined);
    expect(newState2.cr.spec.deploymentPlan.podSecurity).toBe(undefined);
  });
  it('test setting jaas config', () => {
    const initialState = newArtemisCR('namespace');
    const newState = reducer713(initialState, {
      operation: ArtemisReducerOperations713.setJaasExtraConfig,
      payload: 'something',
    });
    expect(newState.cr.spec.deploymentPlan.extraMounts.secrets[0]).toBe(
      'something',
    );
    const newState2 = reducer713(newState, {
      operation: ArtemisReducerOperations713.setJaasExtraConfig,
      payload: undefined,
    });
    expect(newState2.cr.spec.deploymentPlan.extraMounts).toBe(undefined);
  });
  it('test setting service account', () => {
    const initialState = newArtemisCR('namespace');
    const newState = reducer713(initialState, {
      operation: ArtemisReducerOperations713.setServiceAccount,
      payload: 'something',
    });
    expect(newState.cr.spec.deploymentPlan.podSecurity.serviceAccountName).toBe(
      'something',
    );
    const newState2 = reducer713(newState, {
      operation: ArtemisReducerOperations713.setServiceAccount,
      payload: undefined,
    });
    expect(newState2.cr.spec.deploymentPlan.podSecurity).toBe(undefined);
  });
  it('test resetting to 7.12 after setting 7.13 settings', () => {
    const initialState = newArtemisCR('namespace');
    const newState = reducer713(initialState, {
      operation: ArtemisReducerOperations713.isUsingToken,
      payload: true,
    });
    expect(newState.cr.spec.adminUser).toBe(undefined);
    const newState2 = reducer713(newState, {
      operation: ArtemisReducerOperations713.setJaasExtraConfig,
      payload: 'something',
    });
    expect(newState2.cr.spec.deploymentPlan.extraMounts.secrets[0]).toBe(
      'something',
    );
    const newState3 = reducer713(newState2, {
      operation: ArtemisReducerOperations713.setJaasExtraConfig,
      payload: undefined,
    });
    const newState4 = reducer713(newState3, {
      operation: ArtemisReducerOperations713.setServiceAccount,
      payload: 'something',
    });
    expect(
      newState4.cr.spec.deploymentPlan.podSecurity.serviceAccountName,
    ).toBe('something');
    const newState5 = artemisCrReducer(newState4, {
      operation: ArtemisReducerGlobalOperations.setBrokerVersion,
      payload: '7.12',
    });
    expect(newState5.cr.spec.deploymentPlan.podSecurity).toBe(undefined);
    expect(newState5.cr.spec.deploymentPlan.extraMounts).toBe(undefined);
    expect(newState5.cr.spec.adminUser).toBe('admin');
  });
});
