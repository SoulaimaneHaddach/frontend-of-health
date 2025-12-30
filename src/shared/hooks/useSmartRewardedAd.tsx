import { useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';
import { ADS } from '../config/ads';

type UsageState = { count: number; weekStart: number };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function useSmartRewardedAd() {
  const { user } = useAuth();
  const adRef = useRef<any>(null);

  const getKey = (uid: string) => `rewarded_ad_usage:${uid}`;

  const loadState = async (uid: string): Promise<UsageState> => {
    try {
      const raw = await AsyncStorage.getItem(getKey(uid));
      if (!raw) return { count: 0, weekStart: Date.now() };
      const parsed = JSON.parse(raw) as UsageState;
      if (!parsed.weekStart || Date.now() - parsed.weekStart > WEEK_MS) {
        return { count: 0, weekStart: Date.now() };
      }
      return parsed;
    } catch (e) {
      return { count: 0, weekStart: Date.now() };
    }
  };

  const saveState = async (uid: string, state: UsageState) => {
    try {
      await AsyncStorage.setItem(getKey(uid), JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  };

  // show ad with randomness + weekly cap. If ad fails to load/shown, calls fallback
  const showAdAndThen = useCallback(
    async (onAfter: () => void, options?: { chance?: number }) => {
      const uid = user?.id || 'anonymous';
      const chance = options?.chance ?? 0.4; // default 40% probability

      const state = await loadState(uid);
      if (state.count >= 8) {
        // cap reached
        onAfter();
        return { shown: false, reason: 'cap' };
      }

      const roll = Math.random();
      if (roll > chance) {
        // skip showing ad this time
        onAfter();
        return { shown: false, reason: 'skip-random' };
      }

      // proceed to load/show rewarded ad
      // Lazy-require native ad modules and provide a safe fallback when missing (Expo Go)
      let RewardedAd: any = null;
      let RewardedAdEventType: any = null;
      let TestIds: any = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const ads = require('react-native-google-mobile-ads');
        RewardedAd = ads.RewardedAd || ads.default?.RewardedAd;
        RewardedAdEventType = ads.RewardedAdEventType || ads.default?.RewardedAdEventType;
        TestIds = ads.TestIds || ads.default?.TestIds;
        // initialize if available
        try { (ads as any)().initialize?.(); } catch (e) {}
      } catch (e) {
        // native module not available — run fallback immediately
        onAfter();
        return { shown: false, reason: 'no-native' };
      }

      if (!RewardedAd) {
        onAfter();
        return { shown: false, reason: 'no-native' };
      }

      try {
        const adUnit = __DEV__ || !ADS.REWARDED_ID ? (TestIds?.REWARDED ?? 'ca-app-pub-3940256099942544/5224354917') : ADS.REWARDED_ID;
        const rewarded: any = RewardedAd.createForAdRequest(adUnit, {
          requestNonPersonalizedAdsOnly: true,
        });
        adRef.current = rewarded;

        let earned = false;
        let finished = false;

        const cleanup = () => {
          try {
            rewarded.removeAllListeners?.();
          } catch (e) {}
        };

        return await new Promise<any>((resolve) => {
          const onReward = async () => {
            earned = true;
            // increment counter
            const newState = { count: state.count + 1, weekStart: state.weekStart };
            await saveState(uid, newState);
            try { cleanup(); } catch (e) {}
            onAfter();
            finished = true;
            resolve({ shown: true, rewarded: true });
          };

          const onCloseFallback = async () => {
            if (finished) return;
            try { cleanup(); } catch (e) {}
            // if ad closed without reward we still count this as a view attempt
            const newState = { count: state.count + 1, weekStart: state.weekStart };
            await saveState(uid, newState);
            onAfter();
            finished = true;
            resolve({ shown: true, rewarded: earned });
          };

          rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            try {
              rewarded.show();
            } catch (e) {
              onCloseFallback();
            }
          });

          rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
            await onReward();
          });

          rewarded.addAdEventListener((RewardedAdEventType as any).CLOSED, async () => {
            await onCloseFallback();
          });

          rewarded.addAdEventListener((RewardedAdEventType as any).ERROR, async () => {
            // fallback
            try { cleanup(); } catch (e) {}
            onAfter();
            finished = true;
            resolve({ shown: false, reason: 'error' });
          });

          // start loading; set timeout to avoid blocking
          rewarded.load();
          setTimeout(() => {
            if (!finished) {
              // fallback
              try { cleanup(); } catch (e) {}
              onAfter();
              finished = true;
              resolve({ shown: false, reason: 'timeout' });
            }
          }, 7000);
        });
      } catch (err) {
        onAfter();
        return { shown: false, reason: 'exception' };
      }
    },
    [user]
  );

  return { showAdAndThen } as const;
}

export default useSmartRewardedAd;
