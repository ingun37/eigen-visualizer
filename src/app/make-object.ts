import { Matrix4, Matrix3, Object3D, DoubleSide, Vector3, Quaternion, BoxGeometry, MeshBasicMaterial, Mesh, LineBasicMaterial, Geometry, LineSegments, Group, SphereGeometry, Color, PointsMaterial, VertexColors, Points, ConeGeometry, BufferGeometry, Line, ShaderMaterial } from 'three';

export class MakeObject {

static cube(): THREE.Object3D {

    var geometry = new BoxGeometry().translate(0.5, 0.5, 0.5);
    var material = new MeshBasicMaterial({
      color: 0x70a0d0,
      transparent: true,
      opacity: 0.5
    });
    var cube = new Mesh(geometry, material);
  
    var frameMat = new LineBasicMaterial({ color: 0x112233, linewidth: 3 });
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
  
  static urchin(eVecs:THREE.Vector3[]): THREE.Object3D {
    let norms = [0,1,2].map(i=>{
      if (i < eVecs.length) {
        return eVecs[i].normalize()
      } else {
        return new Vector3(0,0,0)
      }
    })
    var geometry = new SphereGeometry(1,30,28)
    geometry.colors = geometry.vertices.map(v=>{
      let rgb = norms.map(x=> Math.pow(Math.abs( x.dot(v.normalize())), 20) ).map(x=>0 * x + 0.95 * (1-x))
      return new Color(rgb[0], rgb[1], rgb[2])
    })
    var material = new PointsMaterial({
      vertexColors: VertexColors,
      size: 0.1
    })
    let sphere = new Points(geometry, material)
    return sphere
  }
  
  static vector(v:THREE.Vector3, color: number): THREE.Object3D {
  
    let coneGeo = new ConeGeometry(0.15, 0.3)
    let coneMat = new MeshBasicMaterial({ color: color })
    let cone = new Mesh(coneGeo, coneMat).translateY(2)
  
    var linemat = new LineBasicMaterial({ color: color, linewidth: 3.5 });
    var lineGeometry = new BufferGeometry().setFromPoints([new Vector3(0, 0, 0), new Vector3(0, 2, 0)]);
    var line = new Line(lineGeometry, linemat);
  
    let group = new Group()
    group.add(cone, line)
    let q = new Quaternion()
    q.setFromUnitVectors(new Vector3(0, 1, 0), v.normalize())
    group.setRotationFromQuaternion(q)
    group.renderOrder = 500
    return group
  }
  
  static sphere(eVecs:THREE.Vector3[]): THREE.Object3D {
    let norms = [0,1,2].map(i=>{
      if (i<eVecs.length) {
        return eVecs[i].normalize()
      } else {
        return new Vector3(0,0,0)
      }
    })
    var geometry = new SphereGeometry(1,10,10)
    let uniforms = {
      "eigen1": { value: norms[0] },
      "eigen2": { value: norms[1] },
      "eigen3": { value: norms[2] },
    };
    var material = new ShaderMaterial({
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
    let sphere = new Mesh(geometry, material)
    let frameMat = new LineBasicMaterial({
      opacity: 0.2,
      color: 0x000000, 
      // linewidth: 3,
      transparent: true
    });
    let frameObj = new LineSegments(geometry, frameMat)
    let group = new Group()
    group.add(sphere, frameObj)
    return group
  }
}
