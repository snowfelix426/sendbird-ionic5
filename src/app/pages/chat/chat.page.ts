import { Component, OnInit, ViewChild } from "@angular/core";
import { NavController, NavParams, IonContent, LoadingController } from "@ionic/angular";
import { SendBirdService } from "../../services/sendbird.service";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.page.html",
  styleUrls: ["./chat.page.scss"],
})
export class ChatPage implements OnInit {
  public chat;
  public chatBox: string = "";
  public messages: Array<{ message: string; createdAt: Date }>;
  private loading;
  public user;
  @ViewChild(IonContent) content: IonContent;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private sendBird: SendBirdService,
    private loadingCtrl: LoadingController
  ) {
    this.loading = this.loadingCtrl.create({
      message: "Please wait...",
      duration: 5000,
    });
    this.loading.present();
    this.chat = this.navParams.get("chat");
    console.log("this.chat: ", this.chat);
    this.user = this.navParams.get("user");
    console.log("this.user: ", this.user);
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

  ngOnInit() { }
  
  public ionViewWillLeave(): void {
    this.sendBird.removeChannelHandler(this.chat.url);
  }

  public sendMessage(message: string = null): void {
    this.scrollBottom();
    if (!message || message === "") return;
    this.chat.sendUserMessage(message, (message, error) => {
      if (error) return console.error(error);
      this.messages.push(message);
      this.chatBox = "";
      this.scrollBottom();
    });
  }

  private subscribeOnReceiveMessages(): any {
    this.sendBird.addChannelHandler(this.chat.url);
    this.sendBird.channelHandler.onMessageReceived = (channel, message) => {
      this.messages.push(message);
      this.scrollBottom();
    };
  }

  private scrollBottom(): void {
    setTimeout(() => {
      this.content.scrollToBottom();
    }, 200);
  }
}
