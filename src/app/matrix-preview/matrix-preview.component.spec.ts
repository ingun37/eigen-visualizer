import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixPreviewComponent } from './matrix-preview.component';

describe('MatrixPreviewComponent', () => {
  let component: MatrixPreviewComponent;
  let fixture: ComponentFixture<MatrixPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MatrixPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatrixPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
