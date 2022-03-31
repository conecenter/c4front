import React, { useEffect, useMemo, useRef, useState }  from 'react';
import { formatInTimeZone } from 'date-fns-tz'
import { identityAt } from '../main/vdom-util';
import { useSync } from '../main/vdom-hooks';
import { Patch } from './input-sync';
import { useUserLocale } from './locale';

interface DateTimeClock {
    key: string,
	identity: Object,
    serverTime: string,
    dateTimeFormatId: string
}

const SYNC_INTERVAL = 600000;

const calcOffset = (timestamp: number) => timestamp - Date.now();

export function DateTimeClock({ identity, serverTime, dateTimeFormatId }: DateTimeClock) {
    const localOffsetRef = useRef(calcOffset(Number(serverTime)));
    const [timestamp, setTimestamp] = useState(Number(serverTime));

    const locale = useUserLocale();
    const pattern = useMemo(() => {
        const dateFormat = locale.dateTimeFormats.find(format => format.id === +dateTimeFormatId);
        return `${dateFormat ? dateFormat.pattern : 'dd-MM-yyyy'}|HH:mm:ss`;
    }, [locale]);

    const localDate = new Date(timestamp);
    const serverDateString = formatInTimeZone(localDate, locale.timezoneId, pattern);
    
    const [date, time] = serverDateString.split('|');

    // Time sync with server
	const timeSyncIdOf = identityAt('timeSync');
	const [_, enqueueTimeSyncPatch] = useSync(timeSyncIdOf(identity)) as [Patch[], (patch: Patch) => void];

    useEffect(() => {
        const id = setInterval(() => { enqueueTimeSyncPatch({value: '1'}) }, SYNC_INTERVAL);
        return () => clearInterval(id);
    }, []);

    // Offset correction after server sync
    useEffect(() => { localOffsetRef.current = calcOffset(Number(serverTime)) }, [serverTime]);

    // Clock ticking functionality
    useEffect(() => {
        const id = setInterval(() => { setTimestamp(Date.now() + localOffsetRef.current) }, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className='dateTimeClock'>
            <span className='dateDisplay'>{date} </span>
            <span>{time}</span>
        </div>
    );
};