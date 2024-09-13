import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelContentComponent } from './channel-content.component';

describe('ChannelContentComponent', () => {
  let component: ChannelContentComponent;
  let fixture: ComponentFixture<ChannelContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelContentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChannelContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
