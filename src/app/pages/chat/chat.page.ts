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
    var messageListQuery = this.chat.createPreviousMessageListQuery();
    messageListQuery.load(
      30,
      true,
      (messageList: Array<{ message: string; createdAt: Date }>, error) => {
        if (error) return console.error(error);
        this.messages.unshift(messageList.reverse());
        this.loading = false;
        this.noMoreResults = false;
        this.completeInfiniteScrollEvent();
        this.loadingBar && this.loadingBar.dismiss();
        this.scrollBottom();
      }
    );
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
}
