import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileAvatarPickerComponent } from './profile-avatar-picker.component';

describe('ProfileAvatarPickerComponent', () => {
  let component: ProfileAvatarPickerComponent;
  let fixture: ComponentFixture<ProfileAvatarPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileAvatarPickerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfileAvatarPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
