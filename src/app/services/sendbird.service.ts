import { Injectable } from '@angular/core';

import * as SendBird from 'SendBird';

@Injectable({
  providedIn: 'root',
})
export class SendBirdService {
  sendBird: any;
  channelHandler: any;

  constructor() {
    this.sendBird = new SendBird({
      appId: 'B575696C-C8AD-4EED-86AF-C26614E5E315',
    });
    this.channelHandler = new this.sendBird.ChannelHandler();
  }

  connectUser(userEmail) {
    return new Promise((resolve, reject) => {
      this.sendBird.connect(userEmail, (user, error) => {
        if (error) return reject(error);
        return resolve(user);
      });
    });
  }

  disconnect() {
    this.sendBird.disconnect(() => console.log("disconnected"));
  }

  getChannels(): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      var channelListQuery = this.sendBird.GroupChannel.createMyGroupChannelListQuery();
      channelListQuery.includeEmpty = true;
      channelListQuery.limit = 20; // pagination limit could be set up to 100
      if (channelListQuery.hasNext) {
        channelListQuery.next(function (channelList, error) {
          if (error) {
            console.error(error);
            return reject(error);
          }
          resolve(channelList);
        });
      }
    });
  }

  createPublicChannel(
    name: string,
    coverUrl: string,
    data: object
  ): Promise<object> {
    return new Promise((resolve, reject) => {
      this.sendBird.OpenChannel.createChannel(
        name,
        coverUrl,
        data,
        (createdChannel, error) => {
          if (error) {
            console.error(error);
            return reject(error);
          }
          return resolve(createdChannel);
        }
      );
    });
  }

  /**
   *
   * @param {any} userId
   * @param {any} name the name of a channel, or the channel topic.
   * @param {any} coverFile the file or URL of the cover image, which you can fetch to render into the UI.
   * @param {any} data the String field to store structured information, such as a JSON String.
   * @param {any} customType the String field that allows you to subclassify your channel.
   * @returns {Promise<any>}
   * @memberof SendBirdService
   */
  createOneToOneChat(
    userId,
    name = userId
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendBird.GroupChannel.createChannelWithUserIds(
        [userId],
        true,
        name,
        null,
        null,
        function (createdChannel, error) {
          if (error) {
            console.error(error);
            return reject(error);
          }
          return resolve(createdChannel);
        }
      );
    });
  }

  enterOnChat(channelUrl): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sendBird.GroupChannel.getChannel(channelUrl, (channel, error) => {
        if (error) {
          console.error(error);
          return reject(error);
        }
        resolve(channel);
      });
    });
  }

  addChannelHandler(uniqueID: string): any {
    this.sendBird.addChannelHandler(uniqueID, this.channelHandler);
  }

  removeChannelHandler(uniqueID: string): void {
    this.sendBird.removeChannelHandler(uniqueID);
  }

  sendChannelMessage(
    message: string = "",
    channel: any
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      channel.sendUserMessage(message, (message, error) => {
        if (error) {
          console.error(error);
          return reject(error);
        }
        return resolve(message);
      });
    });
  }
}
