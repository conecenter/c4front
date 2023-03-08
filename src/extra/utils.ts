async function copyToClipboard(value: string) {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch(err) {
        console.log(err);
        return false;
    }
}

export { copyToClipboard }