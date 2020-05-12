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
import { Matrix4, Matrix3, Object3D, DoubleSide, Vector3, Quaternion, Group } from 'three';
import * as THREE from 'three';
import Matrix, { EigenvalueDecomposition, determinant, inverse } from 'ml-matrix'
import { MakeObject } from '../make-object';
import * as _ from 'lodash'

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
  let de = new EigenvalueDecomposition(matrixState.m33);

  return de;
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

export const selectDeterminant = createSelector(selectMatrix, (matrixState) => {
  return determinant(matrixState.m33)
})

export const selectShape = (state: State) => state.shape


export const selectEigenVectors = createSelector(selectEigen, (eigen)=>{
  return [0,1,2].map(idx => {
    if (eigen.imaginaryEigenvalues[idx] != 0) {
      throw `not diagonalizable: real roots for characteristic equation does not exist.`;
    }
    if (Math.abs(eigen.realEigenvalues[idx]) < 0.001) {
      return new Vector3(0,0,0);
    } else {
      let col = eigen.eigenvectorMatrix.getColumn(idx);
      return new Vector3(col[0],col[1],col[2],);
    }
  })
})

export const selectShapeModel = createSelector(selectInterpolation, selectShape, selectMatrix, selectEigenVectors, (w, sh, rawMat, eVecs)=>{
  let mat = new Matrix4();
  let [stage, stageW] = interpStageOf(w)
  if (stage == InterpStage.Pinv) {
    
  } else if (stage == InterpStage.D) {
    mat = conv33toM4(interpMat(Matrix.eye(3), stageW, new Matrix(rawMat.m33)));
  } else if (stage == InterpStage.P) {
    mat = conv33toM4(new Matrix(rawMat.m33));
  }

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
  return eVecs.filter(v => v.lengthSq() > 0.001) .map((v,i)=>MakeObject.vector(v, [0x00ffff, 0xff00ff, 0xffff00][i]))
})

const selectBasisModel = createSelector(selectEigenVectors, selectInterpolation, (eVecs, w)=>{
  let ijk = [new Vector3(1,0,0),new Vector3(0,1,0),new Vector3(0,0,1),];
  let mat = new Matrix4();
  
  let [stage, stageW] = interpStageOf(w)
  if (stage == InterpStage.Pinv) {
    let cols = _.zip(ijk, eVecs).map(([i,e])=>slerpVec(i,stageW,e));
    // console.log(ijk[0], cols[0], eVecs[0]);
    mat.set(cols[0].x,cols[1].x,cols[2].x,0,
            cols[0].y,cols[1].y,cols[2].y,0,
            cols[0].z,cols[1].z,cols[2].z,0,
            0,0,0,1);
  } else if (stage == InterpStage.D) {
    // console.log(ijk[0], cols[0], eVecs[0]);
    mat.set(eVecs[0].x,eVecs[1].x,eVecs[2].x,0,
            eVecs[0].y,eVecs[1].y,eVecs[2].y,0,
            eVecs[0].z,eVecs[1].z,eVecs[2].z,0,
            0,0,0,1);
  } else if (stage == InterpStage.P) {
    let cols = _.zip(ijk, eVecs).map(([i,e])=> {
        return slerpVec(e,stageW,i);
    });

    // console.log(ijk[0], cols[0], eVecs[0]);
    mat.set(cols[0].x,cols[1].x,cols[2].x,0,
            cols[0].y,cols[1].y,cols[2].y,0,
            cols[0].z,cols[1].z,cols[2].z,0,
            0,0,0,1);
  }

  

  let ax = MakeObject.axis(0, 100, 0, 0x999999);
  let grid = MakeObject.grid();
  let grp = new Group();
  
  
  grp.add(ax, grid);
  grp.matrix = mat;
  grp.matrixAutoUpdate = false;
  grp.updateMatrixWorld(true);
  return [grp];
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

function conv33toM4(p:Matrix):Matrix4 {
  let P = new Matrix4()
  P.set(p.getRow(0)[0], p.getRow(0)[1], p.getRow(0)[2],0,
        p.getRow(1)[0], p.getRow(1)[1], p.getRow(1)[2],0,
        p.getRow(2)[0], p.getRow(2)[1], p.getRow(2)[2],0,
        0,0,0,1);
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
  if (x.lengthSq() < 0.001) {
    x = y;
  } else if (y.lengthSq() < 0.001) {
    y = x;
  }
  let nx = x.clone().normalize();
  let ny = y.clone().normalize();
  let qa = new Quaternion();
  qa.setFromUnitVectors(nx,nx);
  let qb = new Quaternion();
  qb.setFromUnitVectors(nx,ny)
  let q = qa.slerp(qb, w);

  let mag = x.length()*(1-w) + y.length()*w;
  return nx.applyQuaternion(q).setLength(mag);
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
