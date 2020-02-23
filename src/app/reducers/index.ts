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
import { Matrix4, Matrix3 } from 'three';
import { EigenvalueDecomposition, determinant } from 'ml-matrix'

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

export const selectEigen = createSelector(selectMatrix, (matrixState)=>{
  return new EigenvalueDecomposition(matrixState.m33)
})

export class Everything {
  constructor(
    public matrix:Matrix4,
    public ei:EigenvalueDecomposition
  ) {}
}

export const selectDeterminant = createSelector(selectMatrix, (matrixState)=>{
  return determinant(matrixState.m33)
})

export const selectEverything = createSelector(selectThreeMatrix, selectEigen, (mat, ei)=>{
  return new Everything(mat, ei)
})