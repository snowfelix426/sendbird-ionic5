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
  
  edit() {
    this.homeRef.closePopover();
    this.homeRef.editMessage();
  }

  remove() {
    this.homeRef.closePopover();
    this.homeRef.deleteMessage();
  }

}
