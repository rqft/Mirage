export type CallbackFn<T, R = unknown> = (value: T, index: number, list: List<T>) => R;
    export class List<T> {
        [Symbol.iterator]: () => Iterator<T>
        private _array: Array<T>
        private _raw: Iterable<T>
        constructor(list?: Iterable<T>) {
            this._raw = list ?? []
            this._array = Array.from(this._raw)
        }
        public get(index: number) {
            return this._array[index]
        }
        public getMany(...entries: Array<number>) {
            return entries.map(this.get)
        }
        public set(index: number, obj: T) {
            this._array[index] = obj
            return this
        }
        public setMany(...entries: Array<[number, T]>) {
            entries.forEach(([x, v]) => this.set(x, v))
            return this
        }
        public delete(index: number) {
            delete this._array[index]
            return this
        }
        public deleteMany(...entries: Array<number>) {
            entries.forEach(this.delete)
            return this
        }
        public hasIndex(index: number): boolean {
            return index in this._array
        }
        public has(obj: T) {
            return this.indexesOf(obj).size > 0
        }
        public hasMany(...obj: Array<T>) {
            return obj.every(this.has)
        }
        public indexesOf(obj: T): List<number> {
            return this.indexes.filter(v => this._array[v] === obj)
        }
        public firstIndexOf(obj: T) {
            return this.indexesOf(obj).first
        }
        public lastIndexOf(obj: T) {
            return this.indexesOf(obj).last
        }
        public get indexes() {
            return List.from(this._array.keys())
        }
        public get first() {
            return this.get(0)
        }
        public get last() {
            return this.slice(-1).first
        }
        static from<T>(listLike: Iterable<T>) {
            return new this(listLike)
        }
        static of<T>(...listLike: Array<T>) {
            return this.from(listLike)
        }
        public slice(start?: number, end?: number) {
            return List.from(this._array.slice(start, end))
        }
        public filter(callbackfn: CallbackFn<T>, thisArg?: any) {
            return List.from(this._array.filter((v, i, l) => callbackfn(v, i, List.from(l)), thisArg))
        }
        public find(predicate: CallbackFn<T, boolean>, thisArg?: any) {
            return this._array.find((v, i, l) => predicate(v, i, List.from(l)), thisArg)
        }
        public findIndexes(predicate: CallbackFn<T, boolean>, thisArg?: any) {
            return this.indexesOf(this.find(predicate, thisArg))
        }
        public forEach(callbackfn: CallbackFn<T>) {
            for (let i = 0; i < this.size; i++) callbackfn(this.get(i), i, this)
        }
        public stringify(separator: string = ', ') {
            return this._array.join(separator)
        }
        public map<U>(callbackfn: CallbackFn<T, U>) {
            const returned = new List<U>()
            this.forEach((v, i, l) => returned.set(i, callbackfn(v, i, l)))
            return returned
        }
        public deleteLast() {
            return this.delete(this.lastIndex)
        }
        public add(item: T) {
            this.set(this.lastIndex + 1, item)
        }
        public addMany(...items: Array<T>) {
            items.forEach(this.add)
            return this
        }
        public addFirst(...items: Array<T>) {
            return this.setMany(...([...items, ...this._array].map((v, i) => [i, v] as [number, T])))
        }
        public reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: Array<T>) => T, initalValue?: T) {
            return this._array.reduce(callbackfn, initalValue)
        }
        public reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: Array<T>) => T, initalValue?: T) {
            return this._array.reduceRight(callbackfn, initalValue)
        }
        public reverse() {
            const returned = new List<T>()
            this.forEach((_, i) => returned[this.size - i] = this.get(i))
            return returned
        }
        public deleteFirst() {
            return this.delete(this.firstIndex)
        }
        public isAll(value: any, exact = true) {
            return this.every((value2) => exact ? value2 === value : value2 == value)
        }
        public isOne(value: any, exact = true) {
            return this.some((value2) => exact ? value2 === value : value2 == value)
        }
        public some(cb: CallbackFn<T, boolean>) {
            for (let index = 0; index < this.size; index++) {
                if (cb(this.get(index), index, this) === true) return true
            }
            return false
        }
        public every(cb: CallbackFn<T, boolean>) {
            for (let index = 0; index < this.size; index++) {
                if (cb(this.get(index), index, this) === false) return false
            }
            return true
        }
        public sort(compare: (value1: T, value2: T) => number) {
            return List.from(this._array.sort(compare))
        }
        public get size() {
            return this._array.length
        }
        public get lastIndex() {
            return this.lastIndexOf(this.last)
        }
        public copy() {
            return List.from(this)
        }
        /**
         * Usually 0
         */
        public get firstIndex() {
            return this.firstIndexOf(this.first)
        }
        public deleteSection(from: number, to: number) {
            return this.deleteMany(...this.createSectionIndexes(from, to))
        }
        public combine(list: List<T>) {
            return this.addMany(...list.array)
        }
        public setSection(obj: T, from: number, to: number) {
            return this.setMany(...this.createSectionIndexes(from, to).map(value => [value, obj] as [number, T]))
        }
        public getSection(from: number, to: number) {
            return this.getMany(...this.createSectionIndexes(from, to))
        }
        private createSectionIndexes(from: number, to: number) {
            const entries: Array<number> = []
            for (let index = from; index <= to; index++) entries.push(index)
            return entries
        }
        public get array() { return this._array }
        public get raw() { return this._raw }
        public get json() {
            const obj: { [key: number]: T } = {}
            this.forEach((value, index) => obj[index] = value)
            return obj
        }
    }