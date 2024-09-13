import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateReactionsComponent } from './private-reactions.component';

describe('PrivateReactionsComponent', () => {
  let component: PrivateReactionsComponent;
  let fixture: ComponentFixture<PrivateReactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateReactionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrivateReactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
