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
import { Matrix4, Matrix3, Object3D, DoubleSide } from 'three';
import * as THREE from 'three';
import Matrix, { EigenvalueDecomposition, determinant, inverse } from 'ml-matrix'

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
  return [0,1,2]
    .filter(x=>eigen.imaginaryEigenvalues[x] == 0 && Math.abs(eigen.realEigenvalues[x]) > 0.000001)
    .map(i=>eigen.eigenvectorMatrix.getColumn(i))
    .map(c=>new THREE.Vector3(c[0],c[1],c[2]))
})

export const selectShapeModel = createSelector(selectThreeMatrix, selectShape, selectEigenVectors, (mat, sh, eVecs)=>{
  let o:THREE.Object3D
  if (sh == Shape.Cube) {
    o = makeCube()
  } else if (sh == Shape.Urchin) {
    o = makeUrchin(eVecs)
  } else {
    o = makeSphere(eVecs)
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
  return eVecs.map((v,i)=>makeVector(v, [0x00ffff, 0xff00ff, 0xffff00][i]))
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

function makeUrchin(eVecs:THREE.Vector3[]): THREE.Object3D {
  let norms = [0,1,2].map(i=>{
    if (i < eVecs.length) {
      return eVecs[i].normalize()
    } else {
      return new THREE.Vector3(0,0,0)
    }
  })
  var geometry = new THREE.SphereGeometry(1,30,28)
  geometry.colors = geometry.vertices.map(v=>{
    let rgb = norms.map(x=> Math.pow(Math.abs( x.dot(v.normalize())), 20) ).map(x=>0 * x + 0.95 * (1-x))
    return new THREE.Color(rgb[0], rgb[1], rgb[2])
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

function makeSphere(eVecs:THREE.Vector3[]): THREE.Object3D {
  let norms = [0,1,2].map(i=>{
    if (i<eVecs.length) {
      return eVecs[i].normalize()
    } else {
      return new THREE.Vector3(0,0,0)
    }
  })
  var geometry = new THREE.SphereGeometry(1,10,10)
  let uniforms = {
    "eigen1": { value: norms[0] },
    "eigen2": { value: norms[1] },
    "eigen3": { value: norms[2] },
  };
  var material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: uniforms,
    vertexShader: `
    varying vec3 vNormal;
    void main() {
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `,
    fragmentShader: `
    uniform vec3 eigen1;
    uniform vec3 eigen2;
    uniform vec3 eigen3;
    varying vec3 vNormal;
    float compute(vec3 eigen) {
      float w = pow(abs(dot(vNormal, eigen)), 10.0);
      return 0.0*w + 0.95*(1.0-w);
    }
    void main() {
        float r = compute(eigen1);
        float g = compute(eigen2);
        float b = compute(eigen3);
        gl_FragColor = vec4(r,g,b,1.0 - (r*g*b));
    }
    `
  })
  //let rgb = norms.map(x=> Math.pow(Math.abs( x.dot(v.normalize())), 20) ).map(x=>0 * x + 0.95 * (1-x))
  let sphere = new THREE.Mesh(geometry, material)
  let frameMat = new THREE.LineBasicMaterial({
    opacity: 0.2,
    color: 0x000000, 
    // linewidth: 3,
    transparent: true
  });
  let frameObj = new THREE.LineSegments(geometry, frameMat)
  let group = new THREE.Group()
  group.add(sphere, frameObj)
  return group
}

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
    return (interpMat(Matrix.eye(3,3), stageW, (decom.iP)))
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
    return (interpMat(Matrix.eye(3,3), stageW, (decom.P)))
  } else {
    return (Matrix.eye(3,3))
  }
})
function interpMat(x:Matrix, w:number, y:Matrix):Matrix {
  let X = Matrix.multiply(x, 1-w)
  let Y = Matrix.multiply(y, w)
  return Matrix.add(X,Y)
}