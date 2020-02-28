import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { Store, select } from '@ngrx/store';
import { State, selectModels } from '../reducers';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

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
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

  }
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  ngOnInit(): void {
    this.scene.background = new THREE.Color(1, 1, 1)
    let aa = Math.floor( Math.min(window.innerWidth, window.innerHeight) * 0.8)
    this.renderer.setSize(aa, aa);
    this.ref.nativeElement.appendChild(this.renderer.domElement);
		
    this.camera.position.z = 5;
    this.camera.position.y = 2
    this.camera.position.x = 2
    this.camera.lookAt(0, 0, 0)

    let controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.addEventListener( 'change', this.render.bind(this) ); // call this only in static scenes (i.e., if there is no animation loop)
    this.scene.add(makeGrid())

    this.scene.add(makeAxis(0, 100, 0, 0x999999));

    this.store.pipe(select(selectModels)).subscribe(models => {
      this.removeObjectsWithName("model")
      models.forEach(x=>{x.name = "model"})
      this.scene.add(...models)
      this.render()
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

function makeGrid(): THREE.Object3D {
  var size = 5;
  var divisions = 5;

  var gridHelper = new THREE.GridHelper(size, divisions).translateX(2.5).translateZ(2.5);
  gridHelper.renderOrder = -999
  return gridHelper
}
