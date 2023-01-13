async function copyToClipboard(value: string) {
    try {
        await navigator.clipboard.writeText(value);
    } catch(err) {
        console.log(err);
    }
}

export { copyToClipboard }