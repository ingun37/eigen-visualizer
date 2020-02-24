import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { Store, select } from '@ngrx/store';
import { State, selectThreeMatrix, selectEverything, Shape } from '../reducers';
import { Matrix4, Mesh, Geometry, LineSegments, Vector3, CylinderGeometry, Object3D, ConeGeometry, MeshBasicMaterial, Quaternion, Group, Sphere, SphereGeometry, Line } from 'three';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-render',
  templateUrl: './render.component.html',
  styleUrls: ['./render.component.scss']
})
export class RenderComponent implements OnInit {

  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  constructor(
    public ref: ElementRef,
    private store: Store<State>
  ) {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  }

  ngOnInit(): void {
    this.scene.background = new THREE.Color(1, 1, 1)
    this.renderer.setSize(512, 512);
    this.ref.nativeElement.appendChild(this.renderer.domElement);

    this.camera.position.z = 5;
    this.camera.position.y = 2
    this.camera.position.x = 2
    this.camera.lookAt(0, 0, 0)


    this.scene.add(makeGrid())

    this.scene.add(makeAxis(0, 100, 0, 0x999999));

    this.store.pipe(select(selectEverything)).subscribe(everything => {
      let matrix = everything.matrix
      let eigen = everything.ei
      this.removeObjectsWithName("shape")
      this.removeObjectsWithName("eigenvector")

      let aaa = [0, 1, 2]
      let eigenColors = [0xff0000, 0x00ff00, 0x0000ff]//matches with console eigen font colors

      let eigens = aaa.map(i => {
        let col = eigen.eigenvectorMatrix.getColumn(i)
        let v = makeVector(col[0], col[1], col[2], eigenColors[i])
        v.name = "eigenvector"
        return v
      })
      this.scene.add(...eigens)

      let sh: Object3D
      if (everything.sh == Shape.Cube) {
        sh = makeCube()
      } else if (everything.sh == Shape.Urchin) {
        let lines = new SphereGeometry(1, 9, 9).vertices.map(v => {

          var g = new THREE.BufferGeometry().setFromPoints([new Vector3(0, 0, 0), v]);
          var m = new THREE.LineBasicMaterial({ color: 0xf0f000, linewidth: 1 });
          return new Line(g, m)
        })

        let g = new Group()
        g.add(...lines)
        sh = g
      } else {
        sh = makeCube()
      }
      sh.applyMatrix4(matrix)
      sh.name = "shape"
      this.scene.add(sh)

      this.renderer.render(this.scene, this.camera);
    })
  }
  removeObjectsWithName(name: string) {
    let o = this.scene.getObjectByName(name)
    if (o) {
      this.scene.remove(o)
      this.removeObjectsWithName(name)
    }
  }
}

function makeAxis(x: number, y: number, z: number, color: number): THREE.Object3D {
  var material = new THREE.LineBasicMaterial({ color: color, linewidth: 1 });
  var points = [];
  points.push(new THREE.Vector3(0, 0, 0));
  points.push(new THREE.Vector3(x, y, z));
  var geometry = new THREE.BufferGeometry().setFromPoints(points);
  var line = new THREE.Line(geometry, material);
  return line
}

function makeVector(x: number, y: number, z: number, color: number): THREE.Object3D {

  let coneGeo = new ConeGeometry(0.15, 0.3)
  let coneMat = new MeshBasicMaterial({ color: color })
  let cone = new Mesh(coneGeo, coneMat).translateY(2)

  var linemat = new THREE.LineBasicMaterial({ color: color, linewidth: 3.5 });
  var lineGeometry = new THREE.BufferGeometry().setFromPoints([new Vector3(0, 0, 0), new Vector3(0, 2, 0)]);
  var line = new THREE.Line(lineGeometry, linemat);

  let group = new Group()
  group.add(cone, line)
  let q = new Quaternion()
  q.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(x, y, z).normalize())
  group.setRotationFromQuaternion(q)
  group.renderOrder = 500
  return group
}

function makeCube(): Object3D {

  var geometry = new THREE.BoxGeometry().translate(0.5, 0.5, 0.5);
  var material = new THREE.MeshBasicMaterial({
    color: 0x70a0d0,
    transparent: true,
    opacity: 0.5
  });
  var cube = new THREE.Mesh(geometry, material);

  var frameMat = new THREE.LineBasicMaterial({ color: 0x112233, linewidth: 3 });
  let geo = new Geometry()
  geo.vertices = [[0, 1, 0], [1, 1, 0], [1, 1, 0], [1, 1, 1], [1, 1, 1], [0, 1, 1], [0, 1, 1], [0, 1, 0],
  [0, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 1], [1, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 0],
  [0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0], [1, 0, 1], [1, 1, 1], [0, 0, 1], [0, 1, 1]].map(x => new Vector3(x[0], x[1], x[2]))
  let lines = new LineSegments(geo, frameMat)
  lines.renderOrder = 999

  let group = new Group()
  group.add(cube, lines)
  return group
}

function makeGrid(): THREE.Object3D {
  var size = 5;
  var divisions = 5;

  var gridHelper = new THREE.GridHelper(size, divisions).translateX(2.5).translateZ(2.5);
  gridHelper.renderOrder = -999
  return gridHelper
}
