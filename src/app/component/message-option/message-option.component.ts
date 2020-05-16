import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-message-option',
  templateUrl: './message-option.component.html',
  styleUrls: ['./message-option.component.scss'],
})
export class MessageOptionComponent implements OnInit {
  @Input() homeRef;

  constructor() { }

  ngOnInit() { }
  
  remove() {
    this.homeRef.deleteMessage();
    this.homeRef.closePopover();
  }

}
