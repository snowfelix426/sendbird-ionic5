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
import { xssEscape } from '../../config/utils.config';

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
    this.sendBird
      .enterOnChat(this.chat.url)
      .then((channel) => (this.chat = channel));
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
          message.message = _message;
          this.messages.unshift(message);
        });

        this.loading = false;
        this.noMoreResults = false;
        this.completeInfiniteScrollEvent();
        this.loadingBar && this.loadingBar.dismiss();

        if (!loadMore) {
          this.scrollBottom();
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
    this.sendBird.addChannelHandler(this.chat.url);
    this.sendBird.channelHandler.onMessageReceived = (channel, message) => {
      if (this.chat.url === channel.url) {
        this.messages.push(message);
        this.scrollBottom();
      }
    };
    this.sendBird.channelHandler.onMessageUpdated = (channel, message) => {
      if (this.chat.url === channel.url) {
         //this.main.renderMessages([message], false);
      }
    };
    this.sendBird.channelHandler.onMessageDeleted = (channel, messageId) => {
      if (this.chat.url === channel.url) {
        this.deleteMessageFromArray(messageId);
      }
    };
  }

  sendMessage(message = null) {
    this.scrollBottom();
    if (!message || message === "") return;
    this.chat.sendUserMessage(message, (message, error) => {
      if (error) return console.error(error);
      this.messages.push(message);
      this.chatBox = "";
      this.scrollBottom();
    });
  }

  editMessage() {
    this.chatBox = this.currentMessage.message;
    this.messageInput.setFocus();
    this.closePopover();
  }
  
  deleteMessage() {
    this.sendBird.deleteMessage(this.currentMessage, this.chat)
      .then(() => {
        this.deleteMessageFromArray(this.currentMessage.messageId);
      });
    this.closePopover();
  }

  deleteMessageFromArray(messageId) {
    this.messages = this.messages.filter(message => String(message.messageId) !== String(messageId));
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

  getMessageTime(message) {
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC"
    ];

    var _getDay = val => {
      let day = parseInt(val);
      if (day == 1) {
        return day + "st";
      } else if (day == 2) {
        return day + "en";
      } else if (day == 3) {
        return day + "rd";
      } else {
        return day + "th";
      }
    };

    var _checkTime = val => {
      return +val < 10 ? "0" + val : val;
    };

    if (message) {
      const LAST_MESSAGE_YESTERDAY = "YESTERDAY";
      var _nowDate = new Date();
      var _date = new Date(message.createdAt);
      if (_nowDate.getDate() - _date.getDate() == 1) {
        return LAST_MESSAGE_YESTERDAY;
      } else if (
        _nowDate.getFullYear() == _date.getFullYear() &&
        _nowDate.getMonth() == _date.getMonth() &&
        _nowDate.getDate() == _date.getDate()
      ) {
        return (
          _checkTime(_date.getHours()) + ":" + _checkTime(_date.getMinutes())
        );
      } else {
        return months[_date.getMonth()] + " " + _getDay(_date.getDate());
      }
    }
    return "";
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
