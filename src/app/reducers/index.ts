import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer,
  createReducer,
  createAction,
  props,
  on
} from '@ngrx/store';
import { environment } from '../../environments/environment';
import { Matrix4 } from 'three';

export interface State {
  matrix: MatrixState
}

class MatrixState {
  constructor(
    public m33:number[][]
  ) {}
}

export const matrixAction = createAction('[Matrix Component] Set', props<{matrix: number[][]}>());

let matrixReducer = createReducer(new MatrixState([[1,0,0],[0,1,0],[0,0,1]]), on(matrixAction, (state, {matrix}) => {
  return new MatrixState(matrix)
}))

export const reducers: ActionReducerMap<State> = {
  matrix: matrixReducer
};


export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];

export const selectMatrix = (state:State) => state.matrix
export const selectThreeMatrix = createSelector(selectMatrix, (matrixState)=>{
  let m3 = matrixState.m33
  let m4 = new Matrix4()
  m4.set(m3[0][0], m3[0][1], m3[0][2], 0,
         m3[1][0], m3[1][1], m3[1][2], 0,
         m3[2][0], m3[2][1], m3[2][2], 0,
         0, 0, 0, 1)
  return m4
})
