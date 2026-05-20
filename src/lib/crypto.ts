// End-to-end encryption helpers (ECDH P-256 + AES-GCM-256).
// Each user generates a long-lived ECDH keypair on first login.
// - public key (JWK) is published to users/{uid}/publicKey in Firebase.
// - private key (JWK) stays in browser localStorage and never leaves the device.
// Messages are encrypted client-side: derive shared secret with peer's public key,
// then AES-GCM with a random 12-byte IV per message.

const PRIV_KEY = (uid: string) => `nexzhu_ecdh_priv_${uid}`;
const PUB_KEY = (uid: string) => `nexzhu_ecdh_pub_${uid}`;

const b64 = {
  enc: (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))),
  dec: (s: string) => {
    const bin = atob(s);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  },
};

async function generateKeypair() {
  const kp = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
  const pub = await crypto.subtle.exportKey("jwk", kp.publicKey);
  const priv = await crypto.subtle.exportKey("jwk", kp.privateKey);
  return { pub, priv };
}

/** Ensures the user has a local keypair and returns the JWK public key to publish. */
export async function ensureKeypair(uid: string): Promise<JsonWebKey> {
  const pubJson = localStorage.getItem(PUB_KEY(uid));
  const privJson = localStorage.getItem(PRIV_KEY(uid));
  if (pubJson && privJson) {
    try {
      return JSON.parse(pubJson);
    } catch {
      /* fallthrough → regenerate */
    }
  }
  const { pub, priv } = await generateKeypair();
  localStorage.setItem(PUB_KEY(uid), JSON.stringify(pub));
  localStorage.setItem(PRIV_KEY(uid), JSON.stringify(priv));
  return pub;
}

async function loadPrivate(uid: string): Promise<CryptoKey> {
  const raw = localStorage.getItem(PRIV_KEY(uid));
  if (!raw) throw new Error("Kunci privat tidak ditemukan di perangkat ini.");
  return crypto.subtle.importKey(
    "jwk",
    JSON.parse(raw),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"]
  );
}

async function importPublic(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
}

async function deriveSharedKey(myUid: string, peerPub: JsonWebKey): Promise<CryptoKey> {
  const priv = await loadPrivate(myUid);
  const pub = await importPublic(peerPub);
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: pub },
    priv,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(myUid: string, peerPub: JsonWebKey, plain: string) {
  const key = await deriveSharedKey(myUid, peerPub);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain)
  );
  return { iv: b64.enc(iv.buffer), ct: b64.enc(ct) };
}

export async function decryptText(
  myUid: string,
  peerPub: JsonWebKey,
  payload: { iv: string; ct: string }
): Promise<string> {
  const key = await deriveSharedKey(myUid, peerPub);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(b64.dec(payload.iv)) },
    key,
    b64.dec(payload.ct)
  );
  return new TextDecoder().decode(pt);
        }
    
