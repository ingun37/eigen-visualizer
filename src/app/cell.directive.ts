import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appCell]'
})
export class CellDirective {

  wheeled(e:WheelEvent) {
    e.preventDefault()
    console.log(e)
  }
  constructor(el: ElementRef) { 
    el.nativeElement.onwheel = this.wheeled.bind(this)
  }

}
