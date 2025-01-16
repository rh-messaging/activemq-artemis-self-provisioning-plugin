import { newArtemisCR } from '../reducer';
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
    expect(newState2.cr.spec.deploymentPlan.podSecurity).toBe(undefined);
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
});
