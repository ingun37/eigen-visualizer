import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { Store, select } from '@ngrx/store';
import { State, selectThreeMatrix } from '../reducers';
import { Matrix4, Mesh, Geometry, LineSegments, Vector3 } from 'three';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-render',
  templateUrl: './render.component.html',
  styleUrls: ['./render.component.scss']
})
export class RenderComponent implements OnInit {

  scene:THREE.Scene
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  constructor(
    public ref:ElementRef,
    private store: Store<State>
  ) { 
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    
  }

  lastCube:THREE.Object3D
  lastCubeFrame:THREE.LineSegments
  ngOnInit(): void {
    this.scene.background = new THREE.Color(1,1,1)
    this.renderer.setSize( 512, 512 );
    this.ref.nativeElement.appendChild( this.renderer.domElement );

    this.camera.position.z = 5;
    this.camera.position.y = 2
    this.camera.position.x = 2
    this.camera.lookAt(0,0,0)

    
    this.scene.add (makeGrid())

    this.scene.add( makeAxis(0,100,0, 0x00ff00) );
    this.scene.add( makeAxis(100,0,0, 0xff0000) );
    this.scene.add( makeAxis(0,0,100, 0x0000ff) );

    this.store.pipe(select(selectThreeMatrix)).subscribe(matrix=>{
      if (this.lastCube) {
        this.scene.remove(this.lastCube)
      }
      if (this.lastCubeFrame) {
        this.scene.remove(this.lastCubeFrame)
      }
      this.lastCube = makeCube()
      this.lastCube.applyMatrix4(matrix)
      this.scene.add( this.lastCube)

      this.lastCubeFrame = makeCubeFrame()
      this.lastCubeFrame.applyMatrix4(matrix)
      this.scene.add( this.lastCubeFrame)

      this.renderer.render( this.scene, this.camera );
    })

    
  }

}

function makeAxis(x:number, y:number, z:number, color:number):THREE.Line {
  var material = new THREE.LineBasicMaterial( { color: color, linewidth: 2 } );
  var points = [];
  points.push( new THREE.Vector3( 0, 0, 0 ) );
  points.push( new THREE.Vector3( x, y, z ) );
  var geometry = new THREE.BufferGeometry().setFromPoints( points );
  var line = new THREE.Line( geometry, material );
  return line
}

function makeCube():THREE.Mesh {

  var geometry = new THREE.BoxGeometry().translate(0.5,0.5,0.5);
  var material = new THREE.MeshBasicMaterial( { 
    color: 0x70a0d0,
    transparent: true,
    opacity: 0.5
  } );
  var cube = new THREE.Mesh( geometry, material );

  return cube
}

function makeCubeFrame():THREE.LineSegments {
  var material = new THREE.LineBasicMaterial( { color: 0x112233, linewidth: 3 } );
  let geo = new Geometry()
  geo.vertices = [[0,1,0],[1,1,0],[1,1,0],[1,1,1],[1,1,1],[0,1,1],[0,1,1],[0,1,0],
                  [0,0,0],[1,0,0],[1,0,0],[1,0,1],[1,0,1],[0,0,1],[0,0,1],[0,0,0],
                  [0,0,0],[0,1,0],[1,0,0],[1,1,0],[1,0,1],[1,1,1],[0,0,1],[0,1,1]].map(x=>new Vector3(x[0], x[1], x[2]))
  let lines = new LineSegments(geo, material)
  lines.renderOrder = 999
  return lines
}

function makeGrid():THREE.Object3D {
  var size = 5;
  var divisions = 5;
  
  var gridHelper = new THREE.GridHelper( size, divisions ).translateX(2.5).translateZ(2.5);
  gridHelper.renderOrder = -999
  return gridHelper
}
