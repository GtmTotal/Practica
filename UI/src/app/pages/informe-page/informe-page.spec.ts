import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformePageComponent } from './informe-page';

describe('InformePageComponent', () => {
  let component: InformePageComponent;
  let fixture: ComponentFixture<InformePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformePageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InformePageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
