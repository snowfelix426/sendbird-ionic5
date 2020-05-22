import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, LoadingController, PopoverController, IonInput } from '@ionic/angular';
import { SendBirdService } from '../../services/sendbird.service';
import { MessageOptionComponent } from '../../component/message-option/message-option.component';
import {
  format,
  isAfter,
  isBefore,
  isFriday,
  isMonday,
  isSaturday,
  isSunday,
  isThursday,
  isToday,
  isTuesday,
  isWednesday,
  isYesterday,
  toDate,
  subMonths,
  subWeeks,
} from 'date-fns';
import { isNullOrUndefined } from 'util';
import { xssEscape, xssUnEscape, stringToUrlLink, urlLinkToString } from '../../config/utils.config';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  @ViewChild(IonContent) content: IonContent;
  @ViewChild('messageInput') messageInput: IonInput;

  chat: any;
  chatBox: string = "";
  messages: Array<any> = [];
  currentMessage: any;
  user: any;
  loadingBar: any;

  loading = false;
  loadMore = false;
  isScrolling = false;
  isEditing = false;
  infiniteScrollEvent = null;
  noMoreResults = false;
  previousMessageQuery = null;
  newMessagePoint = -1;
  urlexp = new RegExp(
        '(http|https)://[a-z0-9-_]+(.[a-z0-9-_]+)+([a-z0-9-.,@?^=%&;:/~+#]*[a-z0-9-@?^=%&;/~+#])?', 'i');
  
  constructor(
    private sendBird: SendBirdService,
    private popover: PopoverController,
    private loadingCtrl: LoadingController,
    private route: ActivatedRoute,
    public router: Router
  ) {
    this.showLoading();

    this.route.queryParams.subscribe((params) => {
      if (this.router.getCurrentNavigation().extras.state) {
        this.chat = this.router.getCurrentNavigation().extras.state.chat;
        this.user = this.router.getCurrentNavigation().extras.state.user;

        console.log("this.chat: ", this.chat);
        console.log("this.user: ", this.user);
      }
    });
  }

  ngOnInit() {
    this.sendBird.enterOnChat(this.chat.url)
      .then(channel => this.chat = channel);
    this.subscribeOnMessages();

    this.getMessageList();
  }
  
  getMessageList(loadMore = false) {
    if(this.previousMessageQuery === null) {
      this.previousMessageQuery = this.chat.createPreviousMessageListQuery();
    }

    if (this.previousMessageQuery.hasMore && !this.previousMessageQuery.isLoading) {
      this.previousMessageQuery.load(30, true, (messageList, error) => {
        if (error) return console.error(error);
        messageList.forEach(message => {
          let _message = message.message;
          if (this.urlexp.test(_message)) {
            _message =
              '<a href="' +
              _message +
              '" target="_blank" style="color: #3880ff;">' +
              _message +
              '</a>';
          } else {
            _message = xssEscape(_message);
          }
          const group = this.getDateGroupFromMessage(message);
          message.customType = group;
          message.message = _message;
          this.messages.unshift(message);
        });

        this.loading = false;
        this.noMoreResults = false;
        this.completeInfiniteScrollEvent();
        this.loadingBar && this.loadingBar.dismiss();

        if (!loadMore) {
          this.scrollBottom();
          this.chat.markAsRead();
          this.updateUnreadMessageCursor();
        }
      });
    } else {
      this.loading = true;
      this.noMoreResults = true;
      this.completeInfiniteScrollEvent();
    }
  }
  
  async showLoading() {
    this.loadingBar = await this.loadingCtrl.create({
      message: "Please wait...",
      duration: 5000,
    });
    await this.loadingBar.present();
  }

  loadData(event) {
    console.log("infinite scroll load");
    this.infiniteScrollEvent = event;

    this.getMessageList(true);

    if (this.noMoreResults || this.loading) {
      return this.completeInfiniteScrollEvent();
    }

    this.loading = true;
  }

  completeInfiniteScrollEvent() {
    if (this.infiniteScrollEvent) {
      this.infiniteScrollEvent.target.complete();
      this.infiniteScrollEvent = null;
    }
  }

  subscribeOnMessages() {
    this.sendBird.channelHandler.onMessageReceived = (channel, message) => {
      if (this.chat.url === channel.url) {
        this.messages.push(message);
        this.chat.markAsRead();
        this.scrollBottom();
      }
    };
    this.sendBird.channelHandler.onMessageUpdated = (channel, message) => {
      if (this.chat.url === channel.url) {
        this.editMessageFromArray(message);
      }
    };
    this.sendBird.channelHandler.onMessageDeleted = (channel, messageId) => {
      if (this.chat.url === channel.url) {
        this.deleteMessageFromArray(messageId);
      }
    };
    this.sendBird.channelHandler.onChannelChanged = (channel) => {
      if (this.chat.url === channel.url) {
        console.log('channel changed');
        this.updateUnreadMessageCursor();
      }
    };
    this.sendBird.channelHandler.onReadReceiptUpdated = (channel) => {
      if (this.chat.url === channel.url) {
        console.log("Read already");
      }
    }

    this.sendBird.addChannelHandler(this.chat.url);
  }

  sendMessage(message = null) {
    if (!message || message === "") return;

    if (this.isEditing) {
      this.sendBird.updateMessage(this.currentMessage.messageId, message, this.chat)
        .then(message => {
          this.editMessageFromArray(message);
          this.chatBox = "";
        }).catch(error => 
          console.error(error)
        );
    } else {
      this.scrollBottom();
      this.sendBird.sendChannelMessage(message, this.chat)
        .then(message => {
          const group = this.getDateGroupFromMessage(message);
          message.customType = group;
          this.messages.push(message);
          this.chatBox = "";
          this.scrollBottom();
        }).catch(error => 
          console.error(error)
        );
    }
  }

  sendFileMessage(channel, file, action) {
    let thumbSize = [
      {
        maxWidth: 160,
        maxHeight: 160
      }
    ];
    channel.sendFileMessage(file, "", "", thumbSize, (message, error) => {
      if (error) {
        console.error(error);
        return;
      }
      action(message);
    });
  }

  editMessage() {
    this.chatBox = xssUnEscape(this.currentMessage.message);
    this.messageInput.setFocus();
    this.isEditing = true;
  }
  
  deleteMessage() {
    this.sendBird.deleteMessage(this.currentMessage, this.chat)
      .then(() => {
        this.deleteMessageFromArray(this.currentMessage.messageId);
      });
  }

  editMessageFromArray(changedMessage: any) {
    this.messages.forEach(message => {
      if (String(message.messageId) === String(changedMessage.messageId)) {
        message.message = changedMessage.message;
      }
    });
  }

  deleteMessageFromArray(messageId) {
    this.messages = this.messages.filter(message => String(message.messageId) !== String(messageId));
  }

  updateUnreadMessageCursor() {
    if (this.chat.unreadMessageCount !== 0) {
      this.newMessagePoint = this.messages.length - this.chat.unreadMessageCount - 1;
    } else {
      this.newMessagePoint = -1;
    }
  }

  async presentPopover(event, message) {
    const popover = await this.popover.create({
      component: MessageOptionComponent,
      componentProps: {homeRef: this},
      event: event,
      translucent: true
    });
    this.currentMessage = message;
    return await popover.present();
  }

  closePopover() {
    this.popover.dismiss();
  }

  scrollBottom() {
    setTimeout(() => {
      this.content.scrollToBottom();
    }, 200);
  }

  ionViewWillLeave() {
    this.sendBird.removeChannelHandler(this.chat.url);
  }

  getDateGroupFromMessage(message) {
    const createdAt = message.createdAt;
    if (isNullOrUndefined(createdAt)) {
      // console.log('-');
      return "-";
    }
    const parseDate = toDate(message.createdAt);
    // console.log('createdAt:', parseDate);

    // Date before 6 months, return DAY MONTH YEAR
    const pastSixMonths = subMonths(new Date(), 1);
    const afterSixMonths = isAfter(pastSixMonths, parseDate);

    if (afterSixMonths) {
      // console.log('afterSixMonths');
      return format(parseDate, "d MMM y");
    }

    // Date after last week, return WEEKDAY DAY MONTH
    const lastWeek = subWeeks(new Date(), 1);
    const afterLastWeek = isAfter(lastWeek, parseDate);
    if (afterLastWeek) {
      // console.log('afterLastWeek');
      return format(parseDate, "iii, d MMM");
    }

    // Date before last week, return TODAY || YESTERDAY || WEEKDAY
    const today = isToday(parseDate);
    if (today) {
      // console.log('today');
      return "Today";
    }

    const yesterday = isYesterday(parseDate);
    if (yesterday) {
      // console.log('yesterday');
      return "Yesterday";
    }

    const beforeLastWeek = isBefore(lastWeek, parseDate);
    if (beforeLastWeek) {
      // console.log('beforeLastWeek');

      const sunday = isSunday(parseDate);
      if (sunday) {
        // console.log('sunday');
        return "Sunday";
      }

      const saturday = isSaturday(parseDate);
      if (saturday) {
        // console.log('saturday');
        return "Saturday";
      }

      const friday = isFriday(parseDate);
      if (friday) {
        // console.log('friday');
        return "Friday";
      }

      const thursday = isThursday(parseDate);
      if (thursday) {
        // console.log('thursday');
        return "Thursday";
      }

      const wednesday = isWednesday(parseDate);
      if (wednesday) {
        // console.log('wednesday');
        return "Wednesday";
      }

      const tuesday = isTuesday(parseDate);
      if (tuesday) {
        // console.log('tuesday');
        return "Tuesday";
      }

      const monday = isMonday(parseDate);
      if (monday) {
        // console.log('monday');
        return "Monday";
      }
    }
    return "parseDate error";
  }
}
