import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogViewChannelUserListComponent } from './dialog-view-channel-user-list.component';

describe('DialogViewChannelUserListComponent', () => {
  let component: DialogViewChannelUserListComponent;
  let fixture: ComponentFixture<DialogViewChannelUserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogViewChannelUserListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogViewChannelUserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
