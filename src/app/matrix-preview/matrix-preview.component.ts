import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { State, selectThreeMatrix } from '../reducers';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-matrix-preview',
  templateUrl: './matrix-preview.component.html',
  styleUrls: ['./matrix-preview.component.scss']
})
export class MatrixPreviewComponent implements OnInit {
  rows: Observable<string[][]>
  constructor(
    private store: Store<State>
  ) {
    this.rows = store.pipe(select(selectThreeMatrix)).pipe(
      map(x => {
        return [0, 1, 2, 3].map(i => [0, 1, 2, 3].map(j => x.elements[j * 4 + i].toFixed(2)))
      })
    )
  }

  ngOnInit(): void {
  }

}
