import { Component, OnInit } from "@angular/core";
import { Router, NavigationExtras } from "@angular/router";
import {
  NavController,
  LoadingController,
  AlertController
} from "@ionic/angular";
import { SendBirdService } from "../../services/sendbird.service";

@Component({
  selector: "app-list",
  templateUrl: "./list.page.html",
  styleUrls: ["./list.page.scss"],
})
export class ListPage implements OnInit {
  chats: Array<any> = [];
  loading: any;
  user: any;

  constructor(
    private router: Router,
    public navCtrl: NavController,
    private sendBird: SendBirdService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    this.initialConnect();
  }

  ngOnInit() { }
  
  async initialConnect() {
    this.loading = await this.loadingCtrl.create({
      message: "Please wait...",
      duration: 10000,
    });
    this.presentPrompt("Connect as...").then((email) => {
      this.loading.present();
      this.sendBird
        .connectUser(email)
        .then((user) => {
          this.user = user;
          this.getChannels();
        })
        .catch((e) => {
          console.log("error", e)
          this.loading.dismiss();
        });
    });
  }

  createPrivateChannel() {
    this.presentPrompt("Create chat with...").then((user) => {
      this.sendBird.createOneToOneChat(user).then((channel) => {
        this.getChannels();
        console.log("channel", channel);
      });
    });
  }

  chatTapped(event, chat) {
    let data: NavigationExtras = {
      state: {
        chat: chat,
        user: this.user,
      },
    };
    this.router.navigate(["chat"], data);
  }

  getChannels() {
    this.sendBird.getChannels().then((channels) => {
      this.chats = channels;
      console.log("channels: ", channels);
      this.loading.dismiss();
    });
  }

  async presentPrompt(title): Promise<string> {
    let resolveFunction: (data: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolveFunction = resolve;
    });

    const alert = await this.alertCtrl.create({
      header: title,
      inputs: [
        {
          name: "email",
          placeholder: "miquel@consentio.co",
        },
      ],
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
          handler: (data) => resolveFunction(''),
        },
        {
          text: "Choose",
          handler: (data) => {
            if (data.email) resolveFunction(data.email.toLowerCase());
            else resolveFunction("miquel@consentio.co");
          },
        },
      ],
    });
    await alert.present();

    return promise;
  }
}
