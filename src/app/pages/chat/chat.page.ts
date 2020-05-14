import { Component, OnInit, ViewChild } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { IonContent, LoadingController } from "@ionic/angular";
import { SendBirdService } from "../../services/sendbird.service";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.page.html",
  styleUrls: ["./chat.page.scss"],
})
export class ChatPage implements OnInit {
  @ViewChild(IonContent) content: IonContent;

  chat: any;
  chatBox: string = "";
  messages: Array<any> = [];
  user: any;
  loadingBar: any;

  loading = false;
  isScrolling = false;
  infiniteScrollEvent = null;
  noMoreResults = false;
  previousMessageQuery = null;
  
  constructor(
    private sendBird: SendBirdService,
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
    this.subscribeOnReceiveMessages();

    this.getMessageList();
  }
  
  getMessageList() {
    if(this.previousMessageQuery === null) {
      this.previousMessageQuery = this.chat.createPreviousMessageListQuery();
    }

    if (this.previousMessageQuery.hasMore && !this.previousMessageQuery.isLoading) {
      this.previousMessageQuery.load(30, true, (messageList, error) => {
        if (error) return console.error(error);
        let tempTime;
        for (var i = 0; i < messageList.length; i++) {
          this.messages.unshift(messageList[i]);
        }

        this.loading = false;
        this.noMoreResults = false;
        this.completeInfiniteScrollEvent();
        this.loadingBar && this.loadingBar.dismiss();
        this.scrollBottom();
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

    this.getMessageList();

    if (this.noMoreResults || this.loading) {
      return this.completeInfiniteScrollEvent();
    }

    this.loading = true;

    //this.getMessageList(true);
  }

  completeInfiniteScrollEvent() {
    if (this.infiniteScrollEvent) {
      this.infiniteScrollEvent.target.complete();
      this.infiniteScrollEvent = null;
    }
  }

  ionViewWillLeave() {
    this.sendBird.removeChannelHandler(this.chat.url);
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

  subscribeOnReceiveMessages() {
    this.sendBird.addChannelHandler(this.chat.url);
    this.sendBird.channelHandler.onMessageReceived = (channel, message) => {
      this.messages.push(message);
      this.scrollBottom();
    };
  }

  scrollBottom() {
    setTimeout(() => {
      this.content.scrollToBottom();
    }, 200);
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
}
