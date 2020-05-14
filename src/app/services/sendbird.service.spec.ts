import { TestBed } from '@angular/core/testing';

import { SendBirdService } from './sendbird.service';

describe('SendBirdService', () => {
  let service: SendBirdService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SendBirdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
