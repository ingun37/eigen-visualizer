import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { State, selectDeterminant, selectEigen } from '../reducers';
import { Store, select } from '@ngrx/store';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss']
})
export class ConsoleComponent implements OnInit {

  constructor(
    private store: Store<State>

  ) { }

  determinant: Observable<string>
  eigens: Observable<ShowEigen[]>

  ngOnInit(): void {
    this.determinant = this.store.pipe(select(selectDeterminant)).pipe(
      map(det=>{
        return rnd(det)
      })
    )

    this.eigens = this.store.pipe(select(selectEigen)).pipe(
      map(eigen=> {
        let colors = ["#c0c000", "#00c0c0", "#c000c0"]
        return [0,1,2].map(i=>{
          return new ShowEigen(
            colors[i],
            rnd(eigen.diagonalMatrix.get(i,i)), 
            eigen.eigenvectorMatrix.getColumn(i).map(x=>rnd(x)).join(", ")
            )
        })
      })
    )
  }

}
function rnd(n:number):string {
  return Number(n.toFixed(2)).toString()
}
class ShowEigen {
  constructor(
    public color: string,
    public value:string,
    public vector:string
  ) {}
}