import { InscriptionAPIResponse } from '@/models/inscription';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { config } from 'dotenv';
config();

/**
 * Service for fetching Ethscription data from the Ethscriptions API
 */
@Injectable()
export class DataService implements OnModuleInit {

  /** Current ETH/USD price */
  public usdPrice = 0;

  async onModuleInit() {
    // Fetch USD price every 10 minutes
    this.fetchUSDPrice().then(price => {
      this.usdPrice = price;
      setInterval(async () => {
        this.usdPrice = await this.fetchUSDPrice();
      }, 1000 * 60 * 10);
    });
  }

  /**
   * Fetches current ETH/USD price from CoinGecko API
   * @returns Current ETH price in USD
   */
  async fetchUSDPrice(): Promise<number> {
    const url = `https://api.coingecko.com/api/v3/simple/price`;

    const params = new URLSearchParams({
      ids: 'ethereum',
      vs_currencies: 'usd',
    });

    try {
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.log(error);
      return 0;
    }
  }

  /**
   * Fetches inscription data for a given hash ID from the Ethscriptions API
   * 
   * @param hashId - The hash ID of the inscription to fetch
   * @returns The inscription data if found, undefined otherwise
   */
  async fetchInscriptionByHashId(hashId: string): Promise<InscriptionAPIResponse | undefined> {
    const ethscriptionsApiBaseUrl = process.env.ETHSCRIPTIONS_API_BASE_URL;
    const url = `${ethscriptionsApiBaseUrl}/ethscriptions/${hashId}`;
    const response = await fetch(url);
    const data = await response.json();
    return data?.result;
  }
}
