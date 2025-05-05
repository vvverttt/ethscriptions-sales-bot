import { Injectable } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';
import { collectionConfig } from '../constants/collection.config';
import { NotificationMessage } from '../models/notification';

/**
 * Service for interacting with Twitter to send tweets and manage authentication
 */
@Injectable()
export class TwitterService {
  private client: TwitterApi;

  constructor() {
    // Initialize Twitter client
    this.client = new TwitterApi({
      appKey: collectionConfig.twitter.apiKey,
      appSecret: collectionConfig.twitter.apiSecret,
      accessToken: collectionConfig.twitter.accounts.main.accessToken,
      accessSecret: collectionConfig.twitter.accounts.main.accessSecret,
    });
  }

  async testConnection() {
    try {
      const me = await this.client.v2.me();
      console.log('Successfully connected to Twitter as:', me.data.username);
      return true;
    } catch (error) {
      console.error('Error connecting to Twitter:', error);
      return false;
    }
  }

  async tweetSale(saleData: {
    tokenId: string;
    price: string;
    buyer: string;
    seller: string;
    imageUrl: string;
    saleLink: string;
  }) {
    try {
      const tweetText = `Missing Phunk #${saleData.tokenId} just sold for ${saleData.price} ETH!\n\n` +
        `👤 Buyer: ${saleData.buyer}\n` +
        `👤 Seller: ${saleData.seller}\n\n` +
        `${saleData.saleLink}`;

      // Upload the image first
      const mediaId = await this.client.v1.uploadMedia(saleData.imageUrl);

      // Post the tweet with the image
      const tweet = await this.client.v2.tweet({
        text: tweetText,
        media: { media_ids: [mediaId] }
      });

      return tweet;
    } catch (error) {
      console.error('Error posting tweet:', error);
      throw error;
    }
  }

  async sendTweet(data: NotificationMessage) {
    try {
      // Upload the image first
      const mediaId = await this.client.v1.uploadMedia(data.imageBuffer);

      // Post the tweet with the image
      const tweet = await this.client.v2.tweet({
        text: data.message + '\n\n' + data.link,
        media: { media_ids: [mediaId] }
      });

      return tweet;
    } catch (error) {
      console.error('Error posting tweet:', error);
      throw error;
    }
  }
}
