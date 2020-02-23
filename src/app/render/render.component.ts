import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-render',
  templateUrl: './render.component.html',
  styleUrls: ['./render.component.scss']
})
export class RenderComponent implements OnInit {

  constructor(
    public ref:ElementRef
  ) { }

  ngOnInit(): void {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    scene.background = new THREE.Color(1,1,1)
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( 512, 512 );

    this.ref.nativeElement.appendChild( renderer.domElement );

    scene.add( makeAxis(0,100,0, 0x00ff00) );
    scene.add( makeAxis(0,0,100, 0x0000ff) );
    scene.add( makeAxis(100,0,0, 0xff0000) );
    scene.add( makeCube())

    camera.position.z = 5;
    camera.position.y = 2
    camera.position.x = 2
    camera.lookAt(0,0,0)

    renderer.render( scene, camera );
    
  }

}

function makeAxis(x:number, y:number, z:number, color:number):THREE.Line {
  var material = new THREE.LineBasicMaterial( { color: color } );
  var points = [];
  points.push( new THREE.Vector3( 0, 0, 0 ) );
  points.push( new THREE.Vector3( x, y, z ) );
  var geometry = new THREE.BufferGeometry().setFromPoints( points );
  var line = new THREE.Line( geometry, material );
  return line
}

function makeCube():THREE.Mesh {

  var geometry = new THREE.BoxGeometry();
  var material = new THREE.MeshBasicMaterial( { 
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5
  } );
  var cube = new THREE.Mesh( geometry, material );
  return cube
}