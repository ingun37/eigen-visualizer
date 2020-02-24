import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { State, selectDeterminant, selectEigen, Shape, chooseShapeAction } from '../reducers';
import { Store, select } from '@ngrx/store';
import { MatRadioChange } from '@angular/material/radio';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss']
})
export class ConsoleComponent implements OnInit {

  shapeChanged(shape:MatRadioChange): void {
    let sh = this.shapes[shape.value].shape
    this.store.dispatch(chooseShapeAction({shape: sh}))
  }
  constructor(
    private store: Store<State>

  ) { }

  determinant: Observable<string>
  eigens: Observable<ShowEigen[]>

  shapes: ShapeData[] = [
    new ShapeData("Cube", Shape.Cube, true),
    new ShapeData("Urchin", Shape.Urchin, false),
  ]
  ngOnInit(): void {
    this.determinant = this.store.pipe(select(selectDeterminant)).pipe(
      map(det => {
        return rnd(det)
      })
    )

    this.eigens = this.store.pipe(select(selectEigen)).pipe(
      map(eigen => {
        let colors = ["#ff0000", "#00ff00", "#0000ff"]
        return [0, 1, 2].map(i => {
          return new ShowEigen(
            colors[i],
            rnd(eigen.diagonalMatrix.get(i, i)),
            eigen.eigenvectorMatrix.getColumn(i).map(x => rnd(x)).join(", ")
          )
        })
      })
    )
  }

}
function rnd(n: number): string {
  return Number(n.toFixed(2)).toString()
}
class ShowEigen {
  constructor(
    public color: string,
    public value: string,
    public vector: string
  ) { }
}
class ShapeData {
  constructor(
    public name: string,
    public shape: Shape,
    public checked: boolean
  ) { }
}