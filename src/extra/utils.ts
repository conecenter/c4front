async function copyToClipboard(value: string) {
    try {
        await navigator.clipboard.writeText(value);
    } catch(err) {
        console.log(err);
    }
}

function createArray(start: number, end: number) {
    return Array.from({length: end - start + 1}, (_, i) => i + start);
  }

export { copyToClipboard, createArray }