import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostFromOthersComponent } from './post-from-others.component';

describe('PostFromOthersComponent', () => {
  let component: PostFromOthersComponent;
  let fixture: ComponentFixture<PostFromOthersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostFromOthersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PostFromOthersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
