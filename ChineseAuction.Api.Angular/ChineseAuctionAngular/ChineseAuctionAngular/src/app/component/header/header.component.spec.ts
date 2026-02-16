import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Header} from './header.component';

describe('HeaderComponent', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header]
    })
    .compileComponents();
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Header} from './header.component';

describe('HeaderComponent', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
