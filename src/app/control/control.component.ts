import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { State, matrixAction } from '../reducers';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.scss']
})
export class ControlComponent implements OnInit {

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

}
