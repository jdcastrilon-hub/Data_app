import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitorcomprasComponent } from './monitorcompras.component';

describe('MonitorcomprasComponent', () => {
  let component: MonitorcomprasComponent;
  let fixture: ComponentFixture<MonitorcomprasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitorcomprasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonitorcomprasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
