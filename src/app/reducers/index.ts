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
import { Matrix4, Matrix3, Object3D, DoubleSide, Vector3, Quaternion } from 'three';
import * as THREE from 'three';
import Matrix, { EigenvalueDecomposition, determinant, inverse } from 'ml-matrix'
import { MakeObject } from '../make-object';

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
  Urchin,
  Sphere
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

export const selectEigen = createSelector(selectMatrix, (matrixState) => {
  return new EigenvalueDecomposition(matrixState.m33)
})

export const selectDecompose = createSelector(selectEigen, (eigen)=>{
  return {
    P: (eigen.eigenvectorMatrix),
    D: (eigen.diagonalMatrix),
    iP: (inverse(eigen.eigenvectorMatrix))
  }
})
enum InterpStage { Pinv,  D,  P }
const interpStageOf = (weight:number):[InterpStage, number]=>{
  if (weight < 0.333) {
    return [InterpStage.Pinv, weight/0.333]
  } else if (weight < 0.666) {
    return [InterpStage.D, weight/0.333 - 1]
  } else {
    return [InterpStage.P, weight/0.333 - 2]
  }
}
export const selectInterpPinv = createSelector(selectInterpolation, selectDecompose, (weight, decom)=>{
  let [stage, stageW] = interpStageOf(weight)
  if (stage == InterpStage.Pinv) {
    return (slerpMat(Matrix.eye(3,3), stageW, (decom.iP)))
  } else {
    return decom.iP
  }
})
export const selectInterpD = createSelector(selectInterpolation, selectDecompose, (weight, decom)=>{
  let [stage, stageW] = interpStageOf(weight)
  if (stage == InterpStage.D) {
    return (interpMat(Matrix.eye(3,3), stageW, (decom.D)))
  } else if (stage == InterpStage.P) {
    return decom.D
  } else {
    return (Matrix.eye(3,3))
  }
})
export const selectInterpP = createSelector(selectInterpolation, selectDecompose, (weight, decom)=>{
  let [stage, stageW] = interpStageOf(weight)
  if (stage == InterpStage.P) {
    return (slerpMat(Matrix.eye(3,3), stageW, (decom.P)))
  } else {
    return (Matrix.eye(3,3))
  }
})


export const selectThreeMatrix = createSelector(selectInterpP, selectInterpD, selectInterpPinv, (P,D,Pi) => {
  
  let z = P.mmul(D).mmul(Pi)
  
  let m3 = [0,1,2].map(i=>z.getRow(i))
  let m4 = new Matrix4()
  m4.set(
    m3[0][0], m3[0][1], m3[0][2], 0,
    m3[1][0], m3[1][1], m3[1][2], 0,
    m3[2][0], m3[2][1], m3[2][2], 0,
    0, 0, 0, 1)
  return m4
})

export const selectDeterminant = createSelector(selectMatrix, (matrixState) => {
  return determinant(matrixState.m33)
})

export const selectShape = (state: State) => state.shape


export const selectEigenVectors = createSelector(selectEigen, (eigen)=>{
  return [0,1,2]
    .filter(x=>eigen.imaginaryEigenvalues[x] == 0 && Math.abs(eigen.realEigenvalues[x]) > 0.000001)
    .map(i=>eigen.eigenvectorMatrix.getColumn(i))
    .map(c=>new THREE.Vector3(c[0],c[1],c[2]))
})

export const selectShapeModel = createSelector(selectThreeMatrix, selectShape, selectEigenVectors, (mat, sh, eVecs)=>{
  let o:THREE.Object3D
  if (sh == Shape.Cube) {
    o = MakeObject.cube()
  } else if (sh == Shape.Urchin) {
    o = MakeObject.urchin(eVecs)
  } else {
    o = MakeObject.sphere(eVecs)
  }
  o.matrix = mat
  o.matrixAutoUpdate = false
  // o.matrixWorldNeedsUpdate = true
  o.updateMatrixWorld(true)
  // o.matrixAutoUpdate = false
  // o.applyMatrix4(mat)
  // o.updateMatrix()
  return o
})

export const selectEigenVectorModels = createSelector(selectEigenVectors, (eVecs)=>{
  return eVecs.map((v,i)=>MakeObject.vector(v, [0x00ffff, 0xff00ff, 0xffff00][i]))
})

const selectBasisModel = createSelector(selectDecompose, (decom)=>{
  let ax = MakeObject.axis(0, 100, 0, 0x999999);
  let grid = MakeObject.grid();
  return [ax, grid]
})

export const selectModels = createSelector(selectShapeModel, selectEigenVectorModels, selectBasisModel, (tm, em, basis)=>{
  return em.concat([tm]).concat(basis);
})


function convertMat(p:Matrix):Matrix3 {
  let P = new Matrix3()
  P.set(p.getRow(0)[0], p.getRow(0)[1], p.getRow(0)[2],
        p.getRow(1)[0], p.getRow(1)[1], p.getRow(1)[2],
        p.getRow(2)[0], p.getRow(2)[1], p.getRow(2)[2])
  return P
}

function conv3(p:Matrix3):Matrix {
  return new Matrix([0,1,2].map(ri=>{
    return [0,1,2].map(ci=>p.elements[ci*3 + ri])
  }))
}
function interpMat(x:Matrix, w:number, y:Matrix):Matrix {
  let X = Matrix.multiply(x, 1-w)
  let Y = Matrix.multiply(y, w)
  return Matrix.add(X,Y)
}
const zip = (arr1:Vector3[], arr2:Vector3[]) => arr1.map((k, i) => [k, arr2[i]]);
function slerpMat(x:Matrix, w:number, y:Matrix):Matrix {
  let xcols = columnsM(x)
  let ycols = columnsM(y)
  return xcols.map((xcol, ci)=>{
    let ycol = ycols[ci]
    return slerpVec(xcol, w, ycol)
  }).reduce((mat,col,i)=>{
    return mat.setColumn(i,[col.x,col.y,col.z])
  }, new Matrix(3,3))
}
const rng = (n:number)=>Array.from(Array(n).keys())
function columnsM(x:Matrix):Vector3[] {
  return rng(x.columns).map(ci=>{
    let col = x.getColumn(ci)
    return new Vector3(col[0], col[1], col[2])
  })
}
function slerpVec(x:Vector3, w:number, y:Vector3):Vector3 {
  let nx = x.clone();
  nx.normalize();
  let ny = y.clone();
  ny.normalize();
  let q = new Quaternion();
  q.setFromUnitVectors(nx,ny);
  let p = new Quaternion(0,0,0,1);
  let r = p.slerp(q,w);
  let mag = x.length()*(1-w) + y.length()*w;
  return nx.applyQuaternion(r).setLength(mag);
}