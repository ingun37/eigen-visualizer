import { Component } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { State, selectThreeMatrix, selectEigen } from './reducers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'eigen';
  interpolatedMatrix: Observable<string[][]>
  realEigenvalues: Observable<string[][]>
  complexEigenvalues: Observable<string[][]>
  constructor(
    private store:Store<State>
  ) {
    this.interpolatedMatrix = store.pipe(select(selectThreeMatrix)).pipe(
      map(x => {
        return [0, 1, 2].map(i => [0, 1, 2].map(j => Number( x.elements[j * 4 + i].toFixed(2)).toString()))
      })
    )
    this.realEigenvalues = store.pipe(select(selectEigen)).pipe(
      map(x=>{
        return [x.realEigenvalues.map(y=>Number(y.toFixed(2)).toString())]
      })
    )
    this.complexEigenvalues = store.pipe(select(selectEigen)).pipe(
      map(x=>{
        return [x.imaginaryEigenvalues.map(y=>Number(y.toFixed(2)).toString())]
      })
    )
  }
}
