import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DecomposeComponent } from './decompose.component';

describe('DecomposeComponent', () => {
  let component: DecomposeComponent;
  let fixture: ComponentFixture<DecomposeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DecomposeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DecomposeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
