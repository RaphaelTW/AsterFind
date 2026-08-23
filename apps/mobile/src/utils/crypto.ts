import * as Crypto from 'expo-crypto';
import nacl from 'tweetnacl';
import { fromByteArray, toByteArray } from 'base64-js';

function urlSafe(base64: string) {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function fromUrlSafe(value: string) {
  const s = value.replace(/-/g, '+').replace(/_/g, '/');
  return s + '='.repeat((4 - (s.length % 4)) % 4);
}

export async function randomToken(bytes = 24) {
  return urlSafe(fromByteArray(await Crypto.getRandomBytesAsync(bytes)));
}

export async function randomKey() {
  return urlSafe(fromByteArray(await Crypto.getRandomBytesAsync(nacl.secretbox.keyLength)));
}

export function encryptJson(data: unknown, keyString: string) {
  const key = toByteArray(fromUrlSafe(keyString));
  const nonce = Crypto.getRandomBytes(nacl.secretbox.nonceLength);
  const payload = new TextEncoder().encode(JSON.stringify(data));
  const boxed = nacl.secretbox(payload, nonce, key);
  return `${urlSafe(fromByteArray(nonce))}.${urlSafe(fromByteArray(boxed))}`;
}

export function decryptJson<T>(cipher: string, keyString: string): T {
  const [n, b] = cipher.split('.');
  const key = toByteArray(fromUrlSafe(keyString));
  const nonce = toByteArray(fromUrlSafe(n));
  const boxed = toByteArray(fromUrlSafe(b));
  const opened = nacl.secretbox.open(boxed, nonce, key);
  if (!opened) throw new Error('Não foi possível descriptografar os dados.');
  return JSON.parse(new TextDecoder().decode(opened)) as T;
}
