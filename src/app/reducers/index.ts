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
import { Matrix4, Matrix3, Object3D } from 'three';
import * as THREE from 'three';
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
  return m4
})

export const selectEigen = createSelector(selectMatrix, (matrixState) => {
  return new EigenvalueDecomposition(matrixState.m33)
})

export const selectDeterminant = createSelector(selectMatrix, (matrixState) => {
  return determinant(matrixState.m33)
})

export const selectShape = (state: State) => state.shape


export const selectEigenVectors = createSelector(selectEigen, (eigen)=>{
  return [0,1,2].map(i=>eigen.eigenvectorMatrix.getColumn(i)).map(c=>new THREE.Vector3(c[0],c[1],c[2]))
})

export const selectShapeModel = createSelector(selectThreeMatrix, selectShape, selectEigenVectors, (mat, sh, eVecs)=>{
  let o:THREE.Object3D
  if (sh == Shape.Cube) {
    o = makeCube()
  } else {
    o = makeSphere(eVecs[0])
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
  return eVecs.map(v=>makeVector(v, 0xff0000))
})

export const selectModels = createSelector(selectShapeModel, selectEigenVectorModels, (tm, em)=>{
  return em.concat([tm])
})

function makeCube(): THREE.Object3D {

  var geometry = new THREE.BoxGeometry().translate(0.5, 0.5, 0.5);
  var material = new THREE.MeshBasicMaterial({
    color: 0x70a0d0,
    transparent: true,
    opacity: 0.5
  });
  var cube = new THREE.Mesh(geometry, material);

  var frameMat = new THREE.LineBasicMaterial({ color: 0x112233, linewidth: 3 });
  let geo = new THREE.Geometry()
  geo.vertices = [[0, 1, 0], [1, 1, 0], [1, 1, 0], [1, 1, 1], [1, 1, 1], [0, 1, 1], [0, 1, 1], [0, 1, 0],
  [0, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 1], [1, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 0],
  [0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0], [1, 0, 1], [1, 1, 1], [0, 0, 1], [0, 1, 1]].map(x => new THREE.Vector3(x[0], x[1], x[2]))
  let lines = new THREE.LineSegments(geo, frameMat)
  lines.renderOrder = 999

  let group = new THREE.Group()
  group.add(cube, lines)
  return group
}

function makeSphere(eigenv:THREE.Vector3): THREE.Object3D {
  let n = eigenv.normalize()
  var geometry = new THREE.SphereGeometry(1,30,28)
  geometry.colors = geometry.vertices.map(v=>{
    let red = Math.pow(Math.abs(n.dot(v.normalize())), 10)
    return new THREE.Color(1 * red + 0.8 * (1-red),0.8 * (1-red),0.8 * (1-red))
  })
  var material = new THREE.PointsMaterial({
    vertexColors: THREE.VertexColors,
    size: 0.1
  })
  let sphere = new THREE.Points(geometry, material)
  return sphere
}

function makeVector(v:THREE.Vector3, color: number): THREE.Object3D {

  let coneGeo = new THREE.ConeGeometry(0.15, 0.3)
  let coneMat = new THREE.MeshBasicMaterial({ color: color })
  let cone = new THREE.Mesh(coneGeo, coneMat).translateY(2)

  var linemat = new THREE.LineBasicMaterial({ color: color, linewidth: 3.5 });
  var lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 2, 0)]);
  var line = new THREE.Line(lineGeometry, linemat);

  let group = new THREE.Group()
  group.add(cone, line)
  let q = new THREE.Quaternion()
  q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize())
  group.setRotationFromQuaternion(q)
  group.renderOrder = 500
  return group
}