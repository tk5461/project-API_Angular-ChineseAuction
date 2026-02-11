import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsBuyersComponent } from './details-buyers.component';

describe('DetailsBuyersComponent', () => {
  let component: DetailsBuyersComponent;
  let fixture: ComponentFixture<DetailsBuyersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsBuyersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsBuyersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
