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
import Matrix, { EigenvalueDecomposition, determinant } from 'ml-matrix'

export class State {
  matrix: MatrixState
  shape: Shape
  interpolation: number
}

class MatrixState {
  constructor(
    public m33: number[][]
  ) { }
}


export enum Shape {
  Cube,
  Urchin
}
export const chooseShapeAction = createAction('[Shape Component] Choose', props<{ shape: Shape }>());
export const matrixAction = createAction('[Matrix Component] Set', props<{ matrix: number[][] }>());
export const interpolateAction = createAction('[Interpolation Component] Set', props<{ interpolation: number }>())

let matrixReducer = createReducer(new MatrixState([[1, 0, 0], [0, 1, 0], [0, 0, 1]]),
  on(matrixAction, (state, { matrix }) => {
    return new MatrixState(matrix)
  })
)

let shapeReducer = createReducer(Shape.Cube, on(chooseShapeAction, (state, { shape }) => {
  return shape
}))

let interpolationReducer = createReducer(1, on(interpolateAction, (state, { interpolation }) => {
  return interpolation
}))

export const reducers: ActionReducerMap<State> = {
  matrix: matrixReducer,
  shape: shapeReducer,
  interpolation: interpolationReducer
};

export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];

export const selectMatrix = (state: State) => state.matrix

export const selectInterpolation = (state: State) => state.interpolation

export const selectThreeMatrix = createSelector(selectMatrix, selectInterpolation, (matrixState, interp) => {
  let x = new Matrix(matrixState.m33)
  let y = new Matrix([[1,0,0],[0,1,0],[0,0,1]])
  let z = x.mul(interp).add(y.mul(1-interp))

  let m3 = [0,1,2].map(i=>z.getRow(i))
  let m4 = new Matrix4()
  m4.set(
    m3[0][0], m3[0][1], m3[0][2], 0,
    m3[1][0], m3[1][1], m3[1][2], 0,
    m3[2][0], m3[2][1], m3[2][2], 0,
    0, 0, 0, 1)
  let mi = new Matrix4().identity()
  
  return m4
})

export const selectEigen = createSelector(selectMatrix, (matrixState) => {
  return new EigenvalueDecomposition(matrixState.m33)
})

export class Everything {
  constructor(
    public matrix: Matrix4,
    public ei: EigenvalueDecomposition,
    public sh: Shape,
  ) { }
}

export const selectDeterminant = createSelector(selectMatrix, (matrixState) => {
  return determinant(matrixState.m33)
})

export const selectShape = (state: State) => state.shape


export const selectEverything = createSelector(selectThreeMatrix, selectEigen, selectShape, (mat, ei, sh) => {
  return new Everything(mat, ei, sh)
})
