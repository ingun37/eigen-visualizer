import { Component } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { State, selectThreeMatrix } from './reducers';
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
  constructor(
    private store:Store<State>
  ) {
    this.interpolatedMatrix = store.pipe(select(selectThreeMatrix)).pipe(
      map(x => {
        return [0, 1, 2].map(i => [0, 1, 2].map(j => Number( x.elements[j * 4 + i].toFixed(2)).toString()))
      })
    )
  }
}
