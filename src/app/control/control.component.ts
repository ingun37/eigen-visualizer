import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { State, matrixAction, Shape, chooseShapeAction, interpolateAction } from '../reducers';
import { Store } from '@ngrx/store';
import { CellDirective, CellWheelInfo } from '../cell.directive';
import { MatRadioChange } from '@angular/material/radio';
import { MatSliderChange } from '@angular/material/slider';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.scss']
})
export class ControlComponent implements OnInit {
  @ViewChildren(CellDirective) cellChildren !: QueryList<CellDirective>;

  shapes: ShapeData[] = [
    new ShapeData("Cube", Shape.Cube, true),
    new ShapeData("Urchin", Shape.Urchin, false),
    new ShapeData("Sphere", Shape.Sphere, false),
  ]
  formGroup = new FormGroup({
    e11: new FormControl('1'), e12: new FormControl('0'), e13: new FormControl('0'),
    e21: new FormControl('0'), e22: new FormControl('1'), e23: new FormControl('0'),
    e31: new FormControl('0'), e32: new FormControl('0'), e33: new FormControl('1'),
  });
  constructor(
    private store: Store<State>
  ) { }

  ngOnInit(): void {
    this.formGroup.valueChanges.subscribe(inputs => {
      let q = [[inputs.e11, inputs.e12, inputs.e13],
               [inputs.e21, inputs.e22, inputs.e23],
               [inputs.e31, inputs.e32, inputs.e33],]
      let w = q.map(xs=>xs.map(x=>parseFloat(x) || 0))
      this.store.dispatch(matrixAction({matrix: w}))
    })
  }

  ngAfterViewInit(): void {
    this.cellChildren.forEach(cell=>{
      cell.wheelin.subscribe((x:CellWheelInfo)=>{
        let key = `e${x.row}${x.col}`
        let val = Number(this.formGroup.controls[key].value) + x.deltaY * 0.01
        this.formGroup.patchValue({
          [key]: val.toFixed(2)
        })
      })
    })
  }

  shapeChanged(shape:MatRadioChange): void {
    let sh = this.shapes[shape.value].shape
    this.store.dispatch(chooseShapeAction({shape: sh}))
  }

  interpolationChanged(e:MatSliderChange): void {
    this.store.dispatch(interpolateAction({interpolation: e.value/100}))
  }

  sampleClicked(n:number): void {
    if (n == 0) {
      this.formGroup.setValue({
        e11:1,  e12: 3,  e13:3,
        e21:-3, e22: -5, e23:-3,
        e31:3,  e32: 3, e33:1,
      })
    } else if (n==1) {
      this.formGroup.setValue({
        e11:2,  e12: 4,  e13:3,
        e21:-4, e22: -6, e23:-3,
        e31:3,  e32: 3, e33:1,
      })
    } else if (n == 2) {
      this.formGroup.setValue({
        e11:5,  e12: -8,  e13:1,
        e21:0, e22: 0, e23:7,
        e31:0,  e32: 0, e33:-2,
      })
    }
  }
}

class ShapeData {
  constructor(
    public name: string,
    public shape: Shape,
    public checked: boolean
  ) { }
}