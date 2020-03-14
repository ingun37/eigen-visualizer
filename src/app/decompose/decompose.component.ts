import { Component, OnInit } from '@angular/core';
import { Store, select, createSelector } from '@ngrx/store';
import { State, selectEigen } from '../reducers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Matrix3 } from 'three';
import Matrix, { inverse } from 'ml-matrix';

@Component({
  selector: 'app-decompose',
  templateUrl: './decompose.component.html',
  styleUrls: ['./decompose.component.scss']
})
export class DecomposeComponent implements OnInit {
  mP: Observable<string[][]>
  mD: Observable<string[][]>
  mPinv: Observable<string[][]>
  constructor(
    private store: Store<State>
  ) {
    this.mP = store.pipe(select(selectDecompose)).pipe(
      map(x=>x.P),
      map(rows3)
    )
    this.mD = store.pipe(select(selectDecompose)).pipe(
      map(x=>x.D),
      map(rows3)
    )
    this.mPinv = store.pipe(select(selectDecompose)).pipe(
      map(x=>x.iP),
      map(rows3)
    )
  }

  ngOnInit(): void {
    
  }

}
function rows3(of:Matrix3):string[][] {
  return [0,1,2].map(ri=>{
    return [0,1,2].map(ci=>{
      return of.elements[ci*3 + ri].toFixed(2)
    })
  })
}
function convertMat(p:Matrix):Matrix3 {
  let P = new Matrix3()
  P.set(p.getRow(0)[0], p.getRow(0)[1], p.getRow(0)[2],
        p.getRow(1)[0], p.getRow(1)[1], p.getRow(1)[2],
        p.getRow(2)[0], p.getRow(2)[1], p.getRow(2)[2])
  return P
}
const selectDecompose = createSelector(selectEigen, (eigen)=>{
  return {
    P: convertMat(eigen.eigenvectorMatrix),
    D: convertMat(eigen.diagonalMatrix),
    iP: convertMat(inverse(eigen.eigenvectorMatrix))
  }
})