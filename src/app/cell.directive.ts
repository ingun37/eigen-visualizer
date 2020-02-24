import { Directive, HostListener, Input, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[appCell]'
})
export class CellDirective {
  @Input() row:number
  @Input() col:number
  @Output() wheelin: EventEmitter<CellWheelInfo> = new EventEmitter()

  @HostListener('wheel', ['$event']) onWheel(e:WheelEvent) {
    e.preventDefault()
    this.wheelin.emit(new CellWheelInfo(this.row, this.col, e.deltaY))
  }
  constructor() { 
  }

}

export class CellWheelInfo {
  constructor (
    public row:number,
    public col:number,
    public deltaY:number
  ) {}
}