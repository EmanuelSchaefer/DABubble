import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadTextareaComponent } from './thread-textarea.component';

describe('ThreadTextareaComponent', () => {
  let component: ThreadTextareaComponent;
  let fixture: ComponentFixture<ThreadTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadTextareaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThreadTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
