'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Data, deserializeData, monthKey, seed } from '@/domain/finance';
import { createClient } from '@/lib/supabase/client';

type StoreContext = {
  d: Data;
  S: React.Dispatch<React.SetStateAction<Data>>;
  m: string;
  M: React.Dispatch<React.SetStateAction<string>>;
  dark: boolean;
  D: React.Dispatch<React.SetStateAction<boolean>>;
  ready: boolean;
  user: User | null;
  storageError: string | null;
  restoreData: (value: unknown) => void;
  resetData: () => void;
};

const C = createContext<StoreContext | null>(null);

function accountName(user: User) {
  const metadata = user.user_metadata;
  if (typeof metadata.full_name === 'string' && metadata.full_name.trim()) return metadata.full_name.trim();
  if (typeof metadata.name === 'string' && metadata.name.trim()) return metadata.name.trim();
  return user.email?.split('@')[0] || 'Your account';
}

function newAccountData(name: string) {
  const value = seed();
  value.name = name;
  value.salary = 0;
  return value;
}

function parseLocalData(raw: string) {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed === 'object' && parsed !== null && 'data' in parsed && 'savedAt' in parsed) {
    const savedAt = parsed.savedAt;
    if (typeof savedAt !== 'number' || !Number.isFinite(savedAt)) {
      throw Error('Invalid local save timestamp');
    }
    return { data: deserializeData(parsed.data), savedAt };
  }
  return { data: deserializeData(parsed), savedAt: 0 };
}

export function Store({ children }: { children: React.ReactNode }) {
  const initialData = useRef<Data | null>(null);
  const ownerRef = useRef<string | null>(null);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const [d, S] = useState<Data>(() => {
    const value = seed();
    initialData.current = value;
    return value;
  });
  const [m, M] = useState(() => monthKey());
  const [dark, D] = useState(false);
  const [ready, R] = useState(false);
  const [authReady, AR] = useState(false);
  const [ownerId, OI] = useState<string | null>(null);
  const [user, U] = useState<User | null>(null);
  const [ownerName, ON] = useState('Your account');
  const [dataWritable, W] = useState(false);
  const [cloudWritable, CW] = useState(false);
  const [themeWritable, TW] = useState(false);
  const [dataError, DE] = useState<string | null>(null);
  const [cloudError, CE] = useState<string | null>(null);
  const [themeError, TE] = useState<string | null>(null);
  const storageError = [dataError, cloudError, themeError].filter(Boolean).join(' ') || null;

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    function selectUser(nextUser: User | null) {
      U(nextUser);
      ON(nextUser ? accountName(nextUser) : 'Your account');
      const nextOwnerId = nextUser?.id ?? null;

      if (ownerRef.current !== nextOwnerId) {
        ownerRef.current = nextOwnerId;
        R(false);
        W(false);
        CW(false);
        DE(null);
        CE(null);
        OI(nextOwnerId);
      }

      AR(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      selectUser(session?.user ?? null);
    });

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        DE(`Could not verify the signed-in account: ${error.message}`);
        AR(true);
        return;
      }
      selectUser(data.user);
    }).catch((error: unknown) => {
      if (!active) return;
      DE(`Could not verify the signed-in account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      AR(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !ownerId) {
      R(false);
      return;
    }

    let active = true;
    const supabase = createClient();
    const dataKey = `monthly:data:v3:${ownerId}`;

    async function loadAccountData() {
      let localData: Data | null = null;
      let localSavedAt = 0;
      let localReadError: string | null = null;
      let canWriteLocal = false;

      try {
        const raw = localStorage.getItem(dataKey);
        canWriteLocal = true;
        if (raw !== null) {
          try {
            const cached = parseLocalData(raw);
            localData = cached.data;
            localSavedAt = cached.savedAt;
          } catch (error) {
            canWriteLocal = false;
            localReadError = `Saved local data is invalid and has been left untouched: ${error instanceof Error ? error.message : 'Unknown validation error'}`;
          }
        }
      } catch {
        canWriteLocal = false;
        localReadError = 'MONTHLY could not read saved data from this browser.';
      }

      let cloudData: { data: unknown; updated_at: string } | null = null;
      let loadError: string | null = null;
      try {
        const result = await supabase
          .from('user_finance_data')
          .select('data, updated_at')
          .eq('user_id', ownerId)
          .maybeSingle();
        if (result.error) loadError = result.error.message;
        else cloudData = result.data;
      } catch (error) {
        loadError = error instanceof Error ? error.message : 'Unknown network error';
      }

      let value: Data;
      let valueSavedAt = localSavedAt || Date.now();
      let canWriteCloud = !loadError;
      let cloudProblem: string | null = loadError
        ? `Cloud sync is unavailable; this account is using browser storage only. ${loadError}`
        : null;
      let cloudIsAuthoritative = false;

      if (loadError) {
        value = localData ?? newAccountData(ownerName);
      } else if (cloudData) {
        try {
          const remoteValue = deserializeData(cloudData.data);
          const remoteSavedAt = Date.parse(cloudData.updated_at);
          if (!Number.isFinite(remoteSavedAt)) throw Error('Invalid cloud save timestamp');

          if (localData && localSavedAt > remoteSavedAt) {
            value = localData;
            valueSavedAt = localSavedAt;
            const { error } = await supabase.from('user_finance_data').upsert({
              user_id: ownerId,
              data: value,
              updated_at: new Date(valueSavedAt).toISOString(),
            }, { onConflict: 'user_id' });
            if (error) {
              canWriteCloud = false;
              cloudProblem = `Could not sync the latest browser changes to this account: ${error.message}`;
            }
          } else {
            value = remoteValue;
            valueSavedAt = remoteSavedAt;
            cloudIsAuthoritative = true;
          }
        } catch (error) {
          canWriteCloud = false;
          cloudProblem = `Cloud data could not be read and was not changed: ${error instanceof Error ? error.message : 'Unknown validation error'}`;
          value = localData ?? newAccountData(ownerName);
        }
      } else {
        value = localData ?? newAccountData(ownerName);
        valueSavedAt = Date.now();
        try {
          const { error } = await supabase.from('user_finance_data').upsert({
            user_id: ownerId,
            data: value,
            updated_at: new Date(valueSavedAt).toISOString(),
          }, { onConflict: 'user_id' });
          if (error) {
            canWriteCloud = false;
            cloudProblem = `Cloud sync is unavailable; this account is using browser storage only. ${error.message}`;
          }
        } catch (error) {
          canWriteCloud = false;
          cloudProblem = `Cloud sync is unavailable; this account is using browser storage only. ${error instanceof Error ? error.message : 'Unknown network error'}`;
        }
      }

      if (!active) return;

      if (cloudIsAuthoritative) {
        try {
          localStorage.setItem(dataKey, JSON.stringify({ savedAt: valueSavedAt, data: value }));
          canWriteLocal = true;
          localReadError = null;
        } catch {
          canWriteLocal = false;
          localReadError = 'MONTHLY could not update the local account cache; cloud data remains available.';
        }
      } else if (!localReadError && canWriteLocal) {
        try {
          localStorage.setItem(dataKey, JSON.stringify({ savedAt: valueSavedAt, data: value }));
        } catch {
          canWriteLocal = false;
          localReadError = 'MONTHLY could not save data to this browser.';
        }
      }

      S(value);
      initialData.current = value;
      W(canWriteLocal);
      CW(canWriteCloud);
      DE(localReadError);
      CE(cloudProblem);

      try {
        D(localStorage.getItem('monthly:theme') === 'dark');
        TW(true);
      } catch {
        TE('MONTHLY could not read the saved theme preference.');
      }

      M(monthKey());
      R(true);
    }

    void loadAccountData();
    return () => {
      active = false;
    };
  }, [authReady, ownerId]);

  useEffect(() => {
    if (!ready || !ownerId) return;
    if (d === initialData.current) {
      initialData.current = null;
      return;
    }

    const savedAt = Date.now();
    const updatedAt = new Date(savedAt).toISOString();
    if (dataWritable) {
      try {
        localStorage.setItem(`monthly:data:v3:${ownerId}`, JSON.stringify({ savedAt, data: d }));
        DE(null);
      } catch {
        W(false);
        DE('MONTHLY could not save your data to this browser. Your current changes remain in memory only.');
      }
    }

    if (!cloudWritable) return;

    let active = true;
    const timer = window.setTimeout(() => {
      writeQueue.current = writeQueue.current.then(async () => {
        if (!active) return;
        const { error } = await createClient().from('user_finance_data').upsert({
          user_id: ownerId,
          data: d,
          updated_at: updatedAt,
        }, { onConflict: 'user_id' });
        if (!active) return;
        if (error) {
          CW(false);
          CE(`Could not sync changes to this account: ${error.message}`);
        } else {
          CE(null);
        }
      }).catch((error: unknown) => {
        if (active) {
          CW(false);
          CE(`Could not sync changes to this account: ${error instanceof Error ? error.message : 'Unknown network error'}`);
        }
      });
    }, 500);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [d, ready, dataWritable, cloudWritable, ownerId]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    if (!themeWritable) return;

    try {
      localStorage.setItem('monthly:theme', dark ? 'dark' : 'light');
      TE(null);
    } catch {
      TW(false);
      TE('MONTHLY could not save the theme preference.');
    }
  }, [dark, ready, themeWritable]);

  function restoreData(value: unknown) {
    const restored = deserializeData(value);
    S(restored);
    W(true);
    DE(null);
  }

  function resetData() {
    if (!ownerId) throw Error('A signed-in account is required to reset data.');
    S(newAccountData(ownerName));
    W(true);
    DE(null);
  }

  return (
    <C.Provider value={{ d, S, m, M, dark, D, ready, user, storageError, restoreData, resetData }}>
      {children}
    </C.Provider>
  );
}

export function useStore() {
  const value = useContext(C);
  if (!value) throw Error('MONTHLY store is unavailable');
  return value;
}
