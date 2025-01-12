import { Injectable } from '@nestjs/common';

import { AbiEvent, createPublicClient, fromHex, http, parseAbiItem } from 'viem';
import { mainnet } from 'viem/chains';

import { UtilService } from '@/services/util.service';

import { Market, MarketplaceEvent } from '@/models/evm';

import EventEmitter from 'events';
import { config } from 'dotenv';
config();

/**
 * Service for interacting with EVM-compatible blockchains
 */
@Injectable()
export class EvmService {

  private client = createPublicClient({
    chain: mainnet,
    transport: http(process.env.RPC_URL)
  });

  constructor(private readonly utilSvc: UtilService) {}
  
  /**
   * Fetches historical sales events from a marketplace contract by querying logs in chunks
   * @param market The marketplace configuration containing the contract address
   * @param marketEvent The marketplace event configuration containing the event signature and parameters
   * @param blockRange Number of blocks to look back from current block (default 100_000)
   * @returns Array of event logs matching the event signature
   */
  async indexPreviousEvents(
    market: Market,
    marketEvent: MarketplaceEvent,
    blockRange = 100_000
  ) {
    const currentBlock = await this.client.getBlockNumber();
    const targetStartBlock = currentBlock - BigInt(blockRange);
    const CHUNK_SIZE = 10_000;
    const logs = [];

    // Query in chunks of CHUNK_SIZE blocks
    for (let fromBlock = targetStartBlock; fromBlock < currentBlock; fromBlock += BigInt(CHUNK_SIZE)) {
      const toBlock = fromBlock + BigInt(CHUNK_SIZE) > currentBlock 
        ? currentBlock 
        : fromBlock + BigInt(CHUNK_SIZE);
      
      const chunkLogs = await this.client.getLogs({
        address: market.address,
        // If there is an event trigger, use it, otherwise use the market event signature
        event: parseAbiItem(marketEvent.eventTrigger?.signature || marketEvent.signature) as AbiEvent,
        fromBlock,
        toBlock,
      });
      logs.push(...chunkLogs);
    }
    return logs;
  }

  /**
   * Sets up a subscription to watch for new events from a contract
   * @param market The marketplace configuration containing the contract address
   * @param marketEvent The marketplace event configuration containing the event signature and parameters to watch
   * @returns EventEmitter that emits 'event' when new matching logs occur, with cleanup handler to unsubscribe
   */
  watchEvent(market: Market, marketEvent: MarketplaceEvent): EventEmitter {
    const emitter = new EventEmitter();
    
    const unwatch = this.client.watchEvent({
      address: market.address,
      event: parseAbiItem(marketEvent.eventTrigger?.signature || marketEvent.signature) as AbiEvent,
      onLogs: logs => emitter.emit('event', logs)
    });

    emitter.on('cleanup', () => {
      unwatch();
      emitter.removeAllListeners();
    });

    return emitter;
  }

  /**
   * Retrieves the transaction receipt for a given transaction hash
   * @param transactionHash The hash of the transaction to look up
   * @returns The transaction receipt data
   */
  async getTransactionReceipt(transactionHash: `0x${string}`) {
    return await this.client.getTransactionReceipt({ hash: transactionHash });
  }

  /**
   * Retrieves the image data URI from an ethscription transaction by its hash ID
   * @param hashId The hash ID of the ethscription transaction containing the image
   * @returns The data URI string containing the image data, or null if not found
   */
  async getInscriptionImageFromHashId(hashId: `0x${string}`): Promise<string | null> {
    const tx = await this.client.getTransaction({ hash: hashId });
    const dataURI = fromHex(tx.input, 'string');
    return dataURI || null;
  }
}
