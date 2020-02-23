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
  reals: Observable<string>
  ngOnInit(): void {
    this.determinant = this.store.pipe(select(selectDeterminant)).pipe(
      map(det=>{
        return `determinant: ${det}`
      })
    )
    this.reals = this.store.pipe(select(selectEigen)).pipe(
      map(eigen=>{
        return eigen.realEigenvalues.map(x=>x.toString()).join(", ")
      })
    )
  }

}
