import { Component, OnInit } from '@angular/core';
import { Store, select, createSelector } from '@ngrx/store';
import { State, selectDecompose, selectInterpPinv, selectInterpP, selectInterpD } from '../reducers';
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
  pdptex: Observable<string>
  mP: Observable<string[][]>
  mD: Observable<string[][]>
  mPinv: Observable<string[][]>

  interpP: Observable<string[][]>
  interpD: Observable<string[][]>
  interpPinv: Observable<string[][]>

  constructor(
    private store: Store<State>
  ) {
    this.pdptex = store.pipe(select(selectDecompose)).pipe(
      map(pdp=>{
        return [pdp.P, pdp.D, pdp.iP].map(mat2tex).join(" ")
      })
    )
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
    this.interpP = store.pipe(select(selectInterpP)).pipe(map(rows3))
    this.interpD = store.pipe(select(selectInterpD)).pipe(map(rows3))
    this.interpPinv = store.pipe(select(selectInterpPinv)).pipe(map(rows3))
  }

  ngOnInit(): void {
    
  }

}
function rows3(of:Matrix):string[][] {
  return [0,1,2].map(ri=>{
    return [0,1,2].map(ci=>{
      return of.getRow(ri)[ci].toFixed(2)
    })
  })
}
function mat2tex(mat:Matrix):string {
  return "\\begin{pmatrix} " + rng(mat.rows).map(i=>mat.getRow(i)).map(row=>row.map(num2str).join(" & ")).join(' \\\\ ') + " \\end{pmatrix}"
}
function rng(n:number):number[] {
  var arr:number[] = []
  for (let index = 0; index < n; index++) {
    arr.push(index)
  }
  return arr
}
function num2str(n:number):string {
  return Number(n.toFixed(2)).toString()
}