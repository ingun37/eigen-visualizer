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
        return `determinant: ${det}`
      })
    )

    this.eigens = this.store.pipe(select(selectEigen)).pipe(
      map(eigen=> {
        let colors = ["#ff0000", "#00ff00", "#0000ff"]
        return [0,1,2].map(i=>{
          return new ShowEigen(colors[i],eigen.diagonalMatrix.get(i,i).toString(), eigen.eigenvectorMatrix.getColumn(i).map(x=>x.toString()).join(", "))
        })
      })
    )
  }

}

class ShowEigen {
  constructor(
    public color: string,
    public value:string,
    public vector:string
  ) {}
}