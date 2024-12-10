import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { formatInTimeZone } from 'date-fns-tz'
import { identityAt } from '../../main/vdom-util';
import { useSync } from '../../main/vdom-hooks';
import { Patch } from '../exchange/input-sync';
import { useUserLocale } from '../locale';
import { bg, de, da, et, enGB, lt, pl, ro, ru, uk, it } from 'date-fns/locale';
import { useFocusControl } from '../focus-control';
import type { Locale } from 'date-fns'

interface IntlLocales {
	[name: string]: Locale
}
const INTL_LOCALES: IntlLocales = { bg, de, daDK: da, et, en: enGB, lt, pl, rmRO: ro, ru, ukUA: uk, it };

interface MainMenuClock {
	key: string,
	identity: object,
	serverTime: string,
	timestampFormatId: number,
	path: string
}

const SYNC_INTERVAL = 600000;

const calcOffset = (timestamp: number) => timestamp - Date.now();

function MainMenuClock({ identity, serverTime, timestampFormatId, path }: MainMenuClock) {
	const localOffsetRef = useRef(calcOffset(Number(serverTime)));
	const [isSynced, setIsSynced] = useState(Math.abs(localOffsetRef.current) < 1000);
	const [timestamp, setTimestamp] = useState(isSynced ? (Date.now() + localOffsetRef.current) : 0);

	const locale = useUserLocale();
	const pattern = useMemo(() => {
		const dateFormat = locale.dateTimeFormats.find(format => format.id === timestampFormatId);
		return `${dateFormat ? dateFormat.pattern : 'dd-MM-yyyy'}|HH:mm:ss`;
	}, [locale]);

	const formattedDate = formatInTimeZone(
		new Date(timestamp),
		locale.timezoneId,
		pattern,
		{ locale: INTL_LOCALES[locale.shortName] }
	);

	const [date, time] = formattedDate.split('|');

	// Time sync with server
	const timeSyncIdOf = identityAt('timeSync');
	const [_, enqueueTimeSyncPatch] = useSync(timeSyncIdOf(identity)) as [Patch[], (patch: Patch) => void];

	const syncWithServer = () => {
		// condition can be removed after transition to WebSockets
		if (!document.hidden) enqueueTimeSyncPatch({value: '1'});
	}

	useEffect(() => {
		syncWithServer();
		const id = setInterval(syncWithServer, SYNC_INTERVAL);
		return () => clearInterval(id);
	}, []);

	// Offset correction after server sync
	useEffect(() => {
		localOffsetRef.current = calcOffset(Number(serverTime));
		return () => { setIsSynced(true) };
	}, [serverTime]);

	// Clock ticking functionality
	useEffect(() => {
		if (!isSynced) return;
		const tick = () => setTimestamp(Date.now() + localOffsetRef.current);
		const id = setInterval(tick, 1000);
		tick();
		return () => clearInterval(id);
	}, [isSynced]);

	const { focusClass, focusHtml } = useFocusControl(path);

	return (
		<div
			style={isSynced ? undefined : { visibility: 'hidden' }}
			className={clsx('menuCustomItem dateTimeClock', focusClass)}
			{...focusHtml}
		>
			<span className='dateDisplay'>{date}</span>
			<span>{time}</span>
		</div>
	);
}

export { MainMenuClock }