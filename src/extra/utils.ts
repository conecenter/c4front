import { Identity } from "./focus-control";

async function copyToClipboard(value: string) {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch(err) {
        console.log(err);
        return false;
    }
}

const getKeyFromIdentity = (identity: Identity) => identity.parent?.parent?.key || '';

export { copyToClipboard, getKeyFromIdentity }