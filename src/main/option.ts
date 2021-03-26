export {};

const None = '__nothing-e1798429-dd3e-47e1-8ecb-acc92452bdfe__'
type None = typeof None
type Option<T> = T | None

const isEmpty = <T>(option: Option<T>): option is None => option === None
const nonEmpty = <T>(option: Option<T>): option is T => option !== None
const toOption = <T>(value: T | null | undefined): Option<T> => value === null || value === undefined ? None : value
const numToOption = (value: number): Option<number> => isNaN(value) ? None : value
const mapOption = <T, B>(value: Option<T>, func: (value: T) => B): Option<B> => nonEmpty(value) ? func(value) : None
const getOrElse = <T>(value: Option<T>, defaultValue: T): T => nonEmpty(value) ? value : defaultValue

export {isEmpty, nonEmpty, toOption, numToOption, mapOption, getOrElse, None};
export type {Option};

