import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateMessageOtherPostsComponent } from './private-message-other-posts.component';

describe('PrivateMessageOtherPostsComponent', () => {
  let component: PrivateMessageOtherPostsComponent;
  let fixture: ComponentFixture<PrivateMessageOtherPostsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateMessageOtherPostsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PrivateMessageOtherPostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
