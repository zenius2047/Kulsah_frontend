import { describe, expect, it } from 'vitest';
import { endpoints } from '../src/api/endpoints';

describe('KulCoin endpoints', () => {
  it('uses the backend wallet and gift catalog routes', () => {
    expect(endpoints.general.kulCoinWallet).toBe('general/kulcoin/wallet');
    expect(endpoints.general.kulCoinGifts).toBe('general/kulcoin/gifts');
  });

  it('uses separate generic and community-context gift routes', () => {
    expect(endpoints.general.kulCoinGiftSend).toBe('general/kulcoin/gifts/send');
    expect(endpoints.general.communityPostGift(27)).toBe('general/community/posts/27/gift');
  });

  it('exposes the package purchase, ledger, and vote routes', () => {
    expect(endpoints.general.kulCoinPackages).toBe('general/kulcoin/packages');
    expect(endpoints.general.kulCoinPurchase).toBe('general/kulcoin/purchase');
    expect(endpoints.general.kulCoinLedger).toBe('general/kulcoin/ledger');
    expect(endpoints.general.kulCoinVotes).toBe('general/kulcoin/votes');
  });
});
