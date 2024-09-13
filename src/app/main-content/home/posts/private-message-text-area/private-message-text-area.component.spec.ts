import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateMessageTextAreaComponent } from './private-message-text-area.component';

describe('PrivateMessageTextAreaComponent', () => {
  let component: PrivateMessageTextAreaComponent;
  let fixture: ComponentFixture<PrivateMessageTextAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateMessageTextAreaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrivateMessageTextAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
