import React, {useEffect, useMemo, useRef, useState} from 'react';
import {formatInTimeZone} from 'date-fns-tz'
import {identityAt} from '../../main/vdom-util';
import {useSync} from '../../main/vdom-hooks';
import {Patch} from '../exchange/input-sync';
import {useUserLocale} from '../locale';
import {bg, de, da, et, enGB, lt, pl, ro, ru, uk, it} from 'date-fns/locale';

interface IntlLocales {
  [name: string]: Locale
}
const INTL_LOCALES: IntlLocales = { bg, de, daDK: da, et, en: enGB, lt, pl, rmRO: ro, ru, ukUA: uk, it };

interface MainMenuClock {
  key: string,
  identity: Object,
  serverTime: string,
  timestampFormatId: number
}

const SYNC_INTERVAL = 600000;

const calcOffset = (timestamp: number) => timestamp - Date.now();
const getInitialState = (offset: number) => Math.abs(offset) < 1000 ? (Date.now() + offset) : null;

export function MainMenuClock({identity, serverTime, timestampFormatId}: MainMenuClock) {
  const localOffsetRef = useRef(calcOffset(Number(serverTime)));
  const [timestamp, setTimestamp] = useState<number | null>(getInitialState(localOffsetRef.current));
  
  const locale = useUserLocale();
  const pattern = useMemo(() => {
    const dateFormat = locale.dateTimeFormats.find(format => format.id === timestampFormatId);
    return `${dateFormat ? dateFormat.pattern : 'dd-MM-yyyy'}|HH:mm:ss`;
  }, [locale]);

  const formattedDate = timestamp !== null 
    ? formatInTimeZone(new Date(timestamp), locale.timezoneId, pattern, {locale: INTL_LOCALES[locale.shortName]})
    : '|';

  const [date, time] = formattedDate.split('|');

  // Time sync with server
  const timeSyncIdOf = identityAt('timeSync');
  const [_, enqueueTimeSyncPatch] = useSync(timeSyncIdOf(identity)) as [Patch[], (patch: Patch) => void];

  const syncWithServer = () => enqueueTimeSyncPatch({value: '1'});

  useEffect(() => {
    syncWithServer();
    const id = setInterval(syncWithServer, SYNC_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // Offset correction after server sync
  useEffect(() => {
    localOffsetRef.current = calcOffset(Number(serverTime))
  }, [serverTime]);

  // Clock ticking functionality
  useEffect(() => {
    const tick = () => setTimestamp(Date.now() + localOffsetRef.current);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className='menuCustomItem dateTimeClock'>
      <span className='dateDisplay'>{date}</span>
      <span>{time}</span>
    </div>
  );
}
