import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateMessageMyPostComponent } from './private-message-my-post.component';

describe('PrivateMessageMyPostComponent', () => {
  let component: PrivateMessageMyPostComponent;
  let fixture: ComponentFixture<PrivateMessageMyPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateMessageMyPostComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrivateMessageMyPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
