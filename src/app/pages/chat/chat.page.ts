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
  public chat: any;
  public chatBox: string = "";
  public messages: Array<{ message: string; createdAt: Date }>;
  private loading;
  public user;
  @ViewChild(IonContent) content: IonContent;

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

    var messageListQuery = this.chat.createPreviousMessageListQuery();
    messageListQuery.load(
      30,
      true,
      (messageList: Array<{ message: string; createdAt: Date }>, error) => {
        if (error) return console.error(error);
        this.messages = messageList.reverse();
        this.loading && this.loading.dismiss();
        this.scrollBottom();
      }
    );
   }
  
  async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: "Please wait...",
      duration: 5000,
    });
    await this.loading.present();
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
